import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!raw || raw.length < 32) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY must be set (min 32 chars)')
  }
  // Use first 32 bytes of the key string as the encryption key
  return Buffer.from(raw.slice(0, KEY_LENGTH), 'utf-8')
}

export interface EncryptedData {
  encrypted: string // hex
  iv: string        // hex
  tag: string       // hex
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

export function decrypt(data: EncryptedData): string {
  const key = getKey()
  const iv = Buffer.from(data.iv, 'hex')
  const tag = Buffer.from(data.tag, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/** Encrypt both username and password, returning fields ready for DB storage */
export function encryptCredentials(username: string, password: string) {
  const userEnc = encrypt(username)
  const passEnc = encrypt(password)
  return {
    credentialUser: userEnc.encrypted,
    credentialPass: passEnc.encrypted,
    // Share IV and tag for both (store separately for each)
    credentialIv: `${userEnc.iv}:${passEnc.iv}`,
    credentialTag: `${userEnc.tag}:${passEnc.tag}`,
  }
}

/** Decrypt credentials from DB fields */
export function decryptCredentials(fields: {
  credentialUser: string
  credentialPass: string
  credentialIv: string
  credentialTag: string
}) {
  const [userIv, passIv] = fields.credentialIv.split(':')
  const [userTag, passTag] = fields.credentialTag.split(':')

  const username = decrypt({ encrypted: fields.credentialUser, iv: userIv, tag: userTag })
  const password = decrypt({ encrypted: fields.credentialPass, iv: passIv, tag: passTag })

  return { username, password }
}
