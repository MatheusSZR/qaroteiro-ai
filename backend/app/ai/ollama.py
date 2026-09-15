import httpx
from .provider import AIProvider


class OllamaProvider(AIProvider):
    def __init__(self, model: str = "llama3", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url

    async def generate_response(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 3000,
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")