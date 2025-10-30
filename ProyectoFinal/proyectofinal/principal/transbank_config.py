# appprincipal/transbank_config.py

from transbank.webpay.webpay_plus.transaction import Transaction

# Configuración para ambiente de pruebas (integración)
Transaction.commerce_code = "597055555532"
Transaction.api_key = "579B532A7440BB0C9079DED94D31EA161EBE3FA1"
Transaction.environment = "integration"
