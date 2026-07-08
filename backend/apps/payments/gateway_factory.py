# ==========================================================
# PAYMENT GATEWAY FACTORY
# ==========================================================
#
# Returns the correct payment gateway implementation
# based on the requested provider.
#
# This keeps the rest of the application completely
# independent from specific payment providers.
#
# ==========================================================

from .gateways.chapa import ChapaGateway


class UnsupportedPaymentProvider(Exception):
    """
    Raised when an unsupported payment provider is requested.
    """
    pass


class GatewayFactory:
    """
    Factory responsible for creating payment gateway instances.
    """

    _gateways = {
        "chapa": ChapaGateway,
    }

    @classmethod
    def get_gateway(cls, provider: str):
        """
        Return an initialized gateway instance.

        Example:

            gateway = GatewayFactory.get_gateway("chapa")
        """

        gateway_class = cls._gateways.get(provider.lower())

        if gateway_class is None:
            raise UnsupportedPaymentProvider(
                f"Unsupported payment provider: {provider}"
            )

        return gateway_class()