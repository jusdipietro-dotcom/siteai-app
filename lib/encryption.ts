import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16
const KDF_SALT = 'automaticialab-credentials-v1' // fixed salt — key uniqueness comes from the passphrase

let _cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (_cachedKey) return _cachedKey
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!raw || raw.length < 32) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY must be set (min 32 chars)')
  }
  // If key is 64 hex chars, decode directly; otherwise derive via scrypt
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    _cachedKey = Buffer.from(raw, 'hex')
  } else {
    _cachedKey = scryptSync(raw, KDF_SALT, KEY_LENGTH)
  }
  return _cachedKey
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

/** Encrypt portal credentials (supports separate PJN/SCBA), returning fields ready for DB storage */
export function encryptPortalCredentials(creds: {
  pjnUser?: string
  pjnPass?: string
  scbaUser?: string
  scbaPass?: string
}) {
  const users: Record<string, string> = {}
  const passes: Record<string, string> = {}

  if (creds.pjnUser) users.pjn = creds.pjnUser
  if (creds.scbaUser) users.scba = creds.scbaUser
  if (creds.pjnPass) passes.pjn = creds.pjnPass
  if (creds.scbaPass) passes.scba = creds.scbaPass

  const userEnc = encrypt(JSON.stringify(users))
  const passEnc = encrypt(JSON.stringify(passes))

  return {
    credentialUser: userEnc.encrypted,
    credentialPass: passEnc.encrypted,
    credentialIv: `${userEnc.iv}:${passEnc.iv}`,
    credentialTag: `${userEnc.tag}:${passEnc.tag}`,
  }
}

/** Legacy: encrypt single username/password pair */
export function encryptCredentials(username: string, password: string) {
  const userEnc = encrypt(username)
  const passEnc = encrypt(password)
  return {
    credentialUser: userEnc.encrypted,
    credentialPass: passEnc.encrypted,
    credentialIv: `${userEnc.iv}:${passEnc.iv}`,
    credentialTag: `${userEnc.tag}:${passEnc.tag}`,
  }
}

/** Decrypt portal credentials from DB fields (returns per-portal creds) */
export function decryptPortalCredentials(fields: {
  credentialUser: string
  credentialPass: string
  credentialIv: string
  credentialTag: string
}): { pjnUser?: string; pjnPass?: string; scbaUser?: string; scbaPass?: string } {
  const [userIv, passIv] = fields.credentialIv.split(':')
  const [userTag, passTag] = fields.credentialTag.split(':')

  const usersRaw = decrypt({ encrypted: fields.credentialUser, iv: userIv, tag: userTag })
  const passesRaw = decrypt({ encrypted: fields.credentialPass, iv: passIv, tag: passTag })

  const users = JSON.parse(usersRaw) as Record<string, string>
  const passes = JSON.parse(passesRaw) as Record<string, string>

  return {
    pjnUser: users.pjn,
    pjnPass: passes.pjn,
    scbaUser: users.scba,
    scbaPass: passes.scba,
  }
}

/** Legacy: decrypt single credential pair */
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
