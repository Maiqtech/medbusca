from dataclasses import asdict, dataclass


@dataclass
class UsuarioDeactivateResponseDTO:
    mensagem: str = "Usuário desativado."

    def to_dict(self):
        return asdict(self)
