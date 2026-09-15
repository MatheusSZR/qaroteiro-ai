from abc import ABC, abstractmethod

class AIProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str) -> str:
        """Gera uma resposta a partir de um prompt."""
        pass