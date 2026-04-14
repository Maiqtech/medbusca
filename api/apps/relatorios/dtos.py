from dataclasses import asdict, dataclass


@dataclass
class RelatorioMedicoDTO:
    id: int
    nome: str
    especialidade: str
    total_horas: str
    assiduidade: str
    status: str

    def to_dict(self):
        return asdict(self)
