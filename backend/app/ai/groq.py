import os
from openai import AsyncOpenAI
from .provider import AIProvider
from app.core import config_store


class GroqProvider(AIProvider):
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY não definida. Verifique o arquivo backend/.env"
            )
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

    async def generate_response(self, prompt: str) -> str:
        cfg = config_store.get()
        response = await self.client.chat.completions.create(
            model=cfg["modelo"],
            messages=[{"role": "user", "content": prompt}],
            temperature=cfg["temperatura"],
            max_tokens=cfg["max_tokens"],
        )
        return response.choices[0].message.content or ""