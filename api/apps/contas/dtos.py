from dataclasses import asdict, dataclass


@dataclass
class TokenAtivacaoDTO:
    nome: str
    email: str

    def to_dict(self):
        return asdict(self)
