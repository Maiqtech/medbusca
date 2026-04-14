from dataclasses import asdict, dataclass, field


@dataclass
class TurnoHistoricoDTO:
    acao: str
    registrado_em: object

    def to_dict(self):
        return asdict(self)


@dataclass
class MeuTurnoDTO:
    medico: dict
    turno: dict | None
    historico: list[dict]
    turno_pendente_anterior: dict | None = None
    historico_outros_dias: list[dict] = field(default_factory=list)

    def to_dict(self):
        return asdict(self)
