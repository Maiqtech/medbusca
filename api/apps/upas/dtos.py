from dataclasses import asdict, dataclass


@dataclass
class UPAEspecialidadeDisponibilidadeDTO:
    especialidade_id: int
    especialidade: str
    disponivel: bool
    proximo_turno: str | None

    def to_dict(self):
        return asdict(self)


@dataclass
class UPAAvailabilityDTO:
    id: int
    nome: str
    bairro: str
    municipio_nome: str
    especialidades: list[dict]

    def to_dict(self):
        return asdict(self)
