from setuptools import setup, find_packages

setup(
    name="starbucks_genie",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "flask",
        "flask-cors",
        "crewai",
        "python-dotenv",
    ],
) 