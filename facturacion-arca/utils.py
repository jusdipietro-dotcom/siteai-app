"""
Utilidades compartidas para la aplicacion de facturacion.
"""


def validar_cuit(cuit_str):
    """Valida CUIT argentino (11 digitos + digito verificador)."""
    cuit = str(cuit_str).replace("-", "")
    if not cuit.isdigit() or len(cuit) != 11:
        return False
    multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    total = sum(int(cuit[i]) * multiplicadores[i] for i in range(10))
    resto = total % 11
    if resto == 0:
        digito = 0
    elif resto == 1:
        digito = 9
    else:
        digito = 11 - resto
    return int(cuit[10]) == digito
