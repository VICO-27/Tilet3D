# ==========================================================
# PAYMENT GATEWAY INTERFACE
# ==========================================================
class BaseGateway:
    def create_payment(self, payment):
        raise NotImplementedError

    def verify_payment(self, data):
        raise NotImplementedError