from setuptools import setup, find_packages

setup(
    name="souldream",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "pydantic",
        "pydantic-settings",
        "python-dotenv",
        "openai",
        "supabase",
    ],
) 