import { calcularPuntaje, getMedalla } from "@/types/models";
import type { Candidato } from "@/types/models";

function makeCandidato(overrides: Partial<Candidato> = {}): Candidato {
  return {
    id: "1",
    nombre: "Test",
    tipoDocumento: "cedula",
    cedula: "123456",
    email: "test@test.com",
    telefono: "12345678",
    direccion: "Calle 1",
    fechaNacimiento: null,
    paisOrigen: null,
    puesto: "seguridad",
    experiencia: "",
    aniosExperiencia: 0,
    portacionArma: false,
    licenciaConducir: null,
    cursoBasicoPolicial: false,
    disponibilidad: "completa",
    estado: "pendiente",
    createdAt: new Date().toISOString(),
    atestados: [],
    ...overrides,
  };
}

describe("calcularPuntaje", () => {
  it("returns 0 for a candidate with no experience or certifications", () => {
    const c = makeCandidato();
    expect(calcularPuntaje(c)).toBe(0);
  });

  it("adds 10 points per year of experience", () => {
    const c = makeCandidato({ aniosExperiencia: 3 });
    expect(calcularPuntaje(c)).toBe(30);
  });

  it("adds 25 points for portacionArma", () => {
    const c = makeCandidato({ portacionArma: true });
    expect(calcularPuntaje(c)).toBe(25);
  });

  it("adds 20 points for licenciaConducir", () => {
    const c = makeCandidato({ licenciaConducir: "B1" });
    expect(calcularPuntaje(c)).toBe(20);
  });

  it("adds 25 points for cursoBasicoPolicial", () => {
    const c = makeCandidato({ cursoBasicoPolicial: true });
    expect(calcularPuntaje(c)).toBe(25);
  });

  it("adds 10 points for 1-2 atestados", () => {
    const c = makeCandidato({
      atestados: [{ id: "1", nombre: "A", url: "/a", tipo: "cert" }],
    });
    expect(calcularPuntaje(c)).toBe(10);
  });

  it("adds 20 points for 3+ atestados", () => {
    const atestados = [
      { id: "1", nombre: "A", url: "/a", tipo: "cert" },
      { id: "2", nombre: "B", url: "/b", tipo: "cert" },
      { id: "3", nombre: "C", url: "/c", tipo: "cert" },
    ];
    const c = makeCandidato({ atestados });
    expect(calcularPuntaje(c)).toBe(20);
  });

  it("sums all points for a fully qualified candidate", () => {
    const c = makeCandidato({
      aniosExperiencia: 5,
      portacionArma: true,
      licenciaConducir: "B1",
      cursoBasicoPolicial: true,
      atestados: [
        { id: "1", nombre: "A", url: "/a", tipo: "cert" },
        { id: "2", nombre: "B", url: "/b", tipo: "cert" },
        { id: "3", nombre: "C", url: "/c", tipo: "cert" },
      ],
    });
    // 50 + 25 + 20 + 25 + 20 = 140
    expect(calcularPuntaje(c)).toBe(140);
  });
});

describe("getMedalla", () => {
  it('returns "oro" when candidate has everything', () => {
    const c = makeCandidato({
      aniosExperiencia: 2,
      portacionArma: true,
      licenciaConducir: "B1",
      cursoBasicoPolicial: true,
      atestados: [
        { id: "1", nombre: "A", url: "/a", tipo: "cert" },
        { id: "2", nombre: "B", url: "/b", tipo: "cert" },
        { id: "3", nombre: "C", url: "/c", tipo: "cert" },
      ],
    });
    expect(getMedalla(c)).toBe("oro");
  });

  it('returns "plata" when candidate has partial qualifications', () => {
    const c = makeCandidato({
      aniosExperiencia: 1,
      portacionArma: true,
      atestados: [{ id: "1", nombre: "A", url: "/a", tipo: "cert" }],
    });
    expect(getMedalla(c)).toBe("plata");
  });

  it('returns "bronce" for a candidate with nothing', () => {
    const c = makeCandidato();
    expect(getMedalla(c)).toBe("bronce");
  });

  it('returns "bronce" when experience is 0 even with some certs', () => {
    const c = makeCandidato({
      aniosExperiencia: 0,
      portacionArma: true,
    });
    expect(getMedalla(c)).toBe("bronce");
  });

  it('returns "plata" with licenciaConducir, 1 atestado, and 1 year exp', () => {
    const c = makeCandidato({
      aniosExperiencia: 1,
      licenciaConducir: "B1",
      atestados: [{ id: "1", nombre: "A", url: "/a", tipo: "cert" }],
    });
    expect(getMedalla(c)).toBe("plata");
  });
});
