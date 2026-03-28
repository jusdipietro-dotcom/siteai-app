"""
Encriptación/desencriptación de certificados ARCA.
Usa Fernet (AES-128-CBC + HMAC-SHA256).
"""

from cryptography.fernet import Fernet


def generate_key():
    """Genera una nueva clave Fernet. Usar una sola vez para setup."""
    return Fernet.generate_key()


def encrypt_blob(data: bytes, key: str) -> bytes:
    """Encripta datos binarios con la clave Fernet."""
    f = Fernet(key.encode() if isinstance(key, str) else key)
    return f.encrypt(data)


def decrypt_blob(encrypted_data: bytes, key: str) -> bytes:
    """Desencripta datos binarios con la clave Fernet."""
    f = Fernet(key.encode() if isinstance(key, str) else key)
    return f.decrypt(encrypted_data)
