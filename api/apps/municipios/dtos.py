from dataclasses import asdict, dataclass


@dataclass
class MunicipioDeactivateResponseDTO:
    mensagem: str = "Município desativado com sucesso."

    def to_dict(self):
        return asdict(self)
