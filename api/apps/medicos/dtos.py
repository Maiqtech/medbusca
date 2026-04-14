from dataclasses import dataclass


@dataclass
class MedicoQueryDTO:
    upa_id: int | None = None
