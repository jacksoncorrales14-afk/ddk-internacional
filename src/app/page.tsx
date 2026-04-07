import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="text-center">
            <Image src="/logo.png" alt="DDK Internacional" width={140} height={140} className="mx-auto mb-8" />
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              DDK{" "}
              <span className="text-accent-600">
                Internacional
              </span>
            </h1>
            <p className="mx-auto mb-4 text-lg font-semibold text-accent-300">
              Seguridad y Limpieza Profesional
            </p>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-200">
              Unete a nuestro equipo de profesionales. Aplica a puestos de
              seguridad o limpieza y forma parte de una empresa comprometida
              con la excelencia.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/aplicar" className="btn-accent px-8 py-4 text-base">
                Aplicar a un Puesto
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-primary-400 bg-transparent px-8 py-4 text-base font-semibold text-white transition-all hover:bg-primary-600"
              >
                Ya soy Trabajador
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Nuestros Servicios
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Seguridad</h3>
              <p className="text-sm text-gray-500">
                Servicio de vigilancia y proteccion profesional para empresas,
                residenciales y eventos.
              </p>
            </div>
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-100">
                <svg className="h-8 w-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Limpieza</h3>
              <p className="text-sm text-gray-500">
                Servicio de limpieza profesional para oficinas, edificios
                y espacios comerciales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Como Aplicar
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Completa el Formulario</h3>
              <p className="text-sm text-gray-500">
                Llena tus datos personales y selecciona el puesto al que deseas aplicar.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Sube tus Atestados</h3>
              <p className="text-sm text-gray-500">
                Adjunta tu cedula, antecedentes penales, curriculum y otros documentos requeridos.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Espera Nuestra Respuesta</h3>
              <p className="text-sm text-gray-500">
                Nuestro equipo revisara tu solicitud y te contactara para continuar el proceso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Listo para unirte a DDK Internacional?
          </h2>
          <p className="mb-8 text-lg text-primary-200">
            Forma parte de un equipo profesional comprometido con la seguridad y el servicio.
          </p>
          <Link
            href="/aplicar"
            className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-8 py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-accent-600"
          >
            Aplicar Ahora
          </Link>
        </div>
      </section>
    </div>
  );
}
