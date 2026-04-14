from dataclasses import asdict, dataclass


@dataclass
class HealthDTO:
    status: str
    sistema: str
    versao: str

    def to_dict(self):
        return asdict(self)
