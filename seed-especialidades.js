// Script para insertar todas las especialidades en RedNorte
// Ejecutar con: node seed-especialidades.js
// (El API Gateway debe estar corriendo en localhost:8080)

const especialidades = [
  { nombre: 'Medicina General',                 descripcion: 'Control general, morbilidad, chequeo preventivo, seguimiento de enfermedades crónicas' },
  { nombre: 'Medicina Interna',                 descripcion: 'Diabetes, hipertensión, enfermedades metabólicas, enfermedades respiratorias, enfermedades infecciosas' },
  { nombre: 'Pediatría',                        descripcion: 'Pediatría general, neonatología, broncopulmonar infantil, gastroenterología infantil, neurología infantil' },
  { nombre: 'Ginecología y Obstetricia',        descripcion: 'Control ginecológico, control prenatal, fertilidad, climaterio, ecografía obstétrica' },
  { nombre: 'Cardiología',                      descripcion: 'Cardiología general, arritmias, hipertensión arterial, insuficiencia cardíaca, electrocardiograma' },
  { nombre: 'Traumatología',                    descripcion: 'Rodilla, hombro, columna, cadera, mano, pie y tobillo, traumatología deportiva' },
  { nombre: 'Dermatología',                     descripcion: 'Acné, lunares, alergias cutáneas, psoriasis, dermatología estética, cirugía dermatológica' },
  { nombre: 'Neurología',                       descripcion: 'Cefaleas, epilepsia, Parkinson, Alzheimer, accidentes cerebrovasculares, neurofisiología' },
  { nombre: 'Psiquiatría',                      descripcion: 'Ansiedad, depresión, trastornos del ánimo, trastornos del sueño, adicciones' },
  { nombre: 'Psicología',                       descripcion: 'Psicología clínica, infantil, adolescente, familiar, laboral, terapia de pareja' },
  { nombre: 'Oftalmología',                     descripcion: 'Consulta oftalmológica, glaucoma, retina, cataratas, córnea, cirugía refractiva' },
  { nombre: 'Otorrinolaringología',             descripcion: 'Oído, nariz, garganta, audiología, vértigo, rinitis, nasofibrolaringoscopía' },
  { nombre: 'Urología',                         descripcion: 'Próstata, cálculos renales, infertilidad masculina, urología femenina, disfunción urinaria' },
  { nombre: 'Gastroenterología',                descripcion: 'Colon, hígado, reflujo, endoscopía, colonoscopía, enfermedad inflamatoria intestinal' },
  { nombre: 'Endocrinología',                   descripcion: 'Diabetes, tiroides, obesidad, metabolismo, endocrinología reproductiva' },
  { nombre: 'Broncopulmonar',                   descripcion: 'Asma, EPOC, apnea del sueño, alergias respiratorias, función pulmonar' },
  { nombre: 'Nefrología',                       descripcion: 'Enfermedad renal crónica, diálisis, hipertensión renal, cálculos renales' },
  { nombre: 'Reumatología',                     descripcion: 'Artritis, artrosis, lupus, fibromialgia, enfermedades autoinmunes' },
  { nombre: 'Oncología',                        descripcion: 'Oncología médica, quimioterapia, cuidados paliativos, seguimiento oncológico' },
  { nombre: 'Hematología',                      descripcion: 'Anemia, coagulación, leucemia, linfomas, trastornos de plaquetas' },
  { nombre: 'Cirugía General',                  descripcion: 'Hernias, vesícula, apéndice, cirugía digestiva, cirugía laparoscópica' },
  { nombre: 'Cirugía Plástica',                 descripcion: 'Cirugía reconstructiva, quemaduras, estética facial, estética corporal' },
  { nombre: 'Cirugía Vascular',                 descripcion: 'Várices, enfermedad arterial, pie diabético, ecografía vascular' },
  { nombre: 'Neurocirugía',                     descripcion: 'Columna, cerebro, tumores, hernias discales, trauma craneal' },
  { nombre: 'Nutrición / Nutriología',          descripcion: 'Control de peso, nutrición deportiva, diabetes, obesidad, alimentación saludable' },
  { nombre: 'Kinesiología',                     descripcion: 'Rehabilitación motora, respiratoria, deportiva, traumatológica, neurológica' },
  { nombre: 'Fonoaudiología',                   descripcion: 'Lenguaje, habla, voz, deglución, audiología' },
  { nombre: 'Odontología',                      descripcion: 'Odontología general, ortodoncia, endodoncia, periodoncia, implantología, odontopediatría' },
  { nombre: 'Radiología / Imagenología',        descripcion: 'Ecografía, rayos X, scanner/TAC, resonancia magnética, mamografía' },
  { nombre: 'Laboratorio Clínico',              descripcion: 'Exámenes de sangre, orina, perfil bioquímico, hormonas, microbiología' },
  { nombre: 'Medicina Física y Rehabilitación', descripcion: 'Dolor crónico, rehabilitación neurológica, rehabilitación traumatológica, medicina deportiva' },
  { nombre: 'Medicina Familiar',                descripcion: 'Control familiar, crónicos, adulto mayor, salud preventiva, atención integral' },
]

const BASE_URL = 'http://localhost:8080/api/especialidades'

async function seed() {
  console.log(`\n🏥 Insertando ${especialidades.length} especialidades en RedNorte...\n`)
  let ok = 0
  let skip = 0
  let err = 0

  for (const esp of especialidades) {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(esp),
      })

      if (res.status === 201) {
        console.log(`  ✅ ${esp.nombre}`)
        ok++
      } else if (res.status === 409) {
        console.log(`  ⏭  ${esp.nombre} (ya existe)`)
        skip++
      } else {
        const body = await res.text()
        console.log(`  ❌ ${esp.nombre} → ${res.status}: ${body}`)
        err++
      }
    } catch (e) {
      console.log(`  ❌ ${esp.nombre} → Error de conexión: ${e.message}`)
      err++
    }
  }

  console.log(`\n📊 Resultado: ${ok} creadas, ${skip} ya existían, ${err} errores`)
  if (err > 0) console.log('⚠️  Verifica que el API Gateway esté corriendo en localhost:8080')
  console.log()
}

seed()
