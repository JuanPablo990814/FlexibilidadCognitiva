type BaremosType = {
  CC_M: number;
  CC_DS: number;
  EP_M: number;
  EP_DS: number;
};

// Datos transcritos desde las tablas normativas
const normativas: Record<string, BaremosType> = {
  "6": { CC_M: 4.04, CC_DS: 1.79, EP_M: 24.79, EP_DS: 15.35 }, // 6.5 años
  "7": { CC_M: 4.4, CC_DS: 1.7, EP_M: 24.71, EP_DS: 16.06 },
  "8": { CC_M: 4.07, CC_DS: 1.55, EP_M: 21.37, EP_DS: 13.52 },
  "9": { CC_M: 5, CC_DS: 1.32, EP_M: 17.37, EP_DS: 9.16 },
  "10": { CC_M: 5.71, CC_DS: 0.76, EP_M: 13.18, EP_DS: 8.45 },
  "11": { CC_M: 4.86, CC_DS: 1.46, EP_M: 19.2, EP_DS: 11.88 },
  "12": { CC_M: 4.8, CC_DS: 1.58, EP_M: 20.96, EP_DS: 16.74 },
  "13": { CC_M: 4.28, CC_DS: 1.53, EP_M: 21.31, EP_DS: 10.54 },
  "14": { CC_M: 5, CC_DS: 1.47, EP_M: 16.93, EP_DS: 10.68 },
  "15": { CC_M: 5.53, CC_DS: 1.22, EP_M: 12.28, EP_DS: 6.36 },
  "16": { CC_M: 5.24, CC_DS: 1.27, EP_M: 13, EP_DS: 7.3 },
  "17": { CC_M: 5.81, CC_DS: 0.54, EP_M: 9.81, EP_DS: 6.58 },
  "18": { CC_M: 5.29, CC_DS: 1.29, EP_M: 12.05, EP_DS: 7.86 },
  "19": { CC_M: 5.29, CC_DS: 1.29, EP_M: 12.05, EP_DS: 7.86 },
  "20-29": { CC_M: 5.75, CC_DS: 0.77, EP_M: 8.93, EP_DS: 6.7 },
  "30-39": { CC_M: 5.62, CC_DS: 1.08, EP_M: 8.29, EP_DS: 7 },
  "40-49": { CC_M: 5.52, CC_DS: 1.24, EP_M: 9.27, EP_DS: 9.61 },
  "50-59": { CC_M: 5.46, CC_DS: 1.35, EP_M: 10.81, EP_DS: 12.8 },
  "60-64": { CC_M: 4.64, CC_DS: 1.7, EP_M: 17.72, EP_DS: 13.06 },
  "65-69": { CC_M: 4.31, CC_DS: 2.07, EP_M: 20.34, EP_DS: 14.08 },
  "70-74": { CC_M: 3.97, CC_DS: 1.64, EP_M: 23.9, EP_DS: 10.74 },
  "75-79": { CC_M: 2.87, CC_DS: 1.54, EP_M: 35.69, EP_DS: 18.51 },
  "80-84": { CC_M: 3.78, CC_DS: 2.24, EP_M: 28.28, EP_DS: 18.45 },
  "85-89": { CC_M: 2.75, CC_DS: 3.2, EP_M: 25.25, EP_DS: 15.62 },
};

function obtenerBaremoPorEdad(edad: number): BaremosType {
  if (edad <= 6) return normativas["6"];
  if (edad >= 7 && edad <= 19) return normativas[edad.toString()];
  
  if (edad >= 20 && edad <= 29) return normativas["20-29"];
  if (edad >= 30 && edad <= 39) return normativas["30-39"];
  if (edad >= 40 && edad <= 49) return normativas["40-49"];
  if (edad >= 50 && edad <= 59) return normativas["50-59"];
  if (edad >= 60 && edad <= 64) return normativas["60-64"];
  if (edad >= 65 && edad <= 69) return normativas["65-69"];
  if (edad >= 70 && edad <= 74) return normativas["70-74"];
  if (edad >= 75 && edad <= 79) return normativas["75-79"];
  if (edad >= 80 && edad <= 84) return normativas["80-84"];
  
  return normativas["85-89"]; // Mayor a 85
}

export type Interpretacion = {
  resultado: string;
  rangoNormal: string;
  interpretacion: "Normal" | "Límite" | "Fuera de lo normal";
  explicacionSimple: string;
  conclusion: string;
}

export function interpretarPuntuacion(
  resultado: number, 
  edad: number, 
  tipo: "categorias" | "errores_perseverativos"
): Interpretacion {
  const baremos = obtenerBaremoPorEdad(edad);
  
  const media = tipo === "categorias" ? baremos.CC_M : baremos.EP_M;
  const ds = tipo === "categorias" ? baremos.CC_DS : baremos.EP_DS;
  
  const limiteInferior = (media - ds).toFixed(1);
  const limiteSuperior = (media + ds).toFixed(1);
  const rango = `${limiteInferior} a ${limiteSuperior}`;
  
  // Distancia en desviaciones estándar
  const zScore = (resultado - media) / ds;
  const absZ = Math.abs(zScore);
  
  let clasificacion: "Normal" | "Límite" | "Fuera de lo normal" = "Normal";
  
  if (absZ > 2) {
    clasificacion = "Fuera de lo normal";
  } else if (absZ > 1) {
    clasificacion = "Límite";
  }
  
  let explicacion = "";
  let conclusion = "";
  
  if (tipo === "categorias") {
    // Mayor es mejor (resolución de problemas)
    if (clasificacion === "Normal") {
      explicacion = `La mayoría de personas de ${edad} años completa entre ${rango} categorías. El resultado logrado está dentro de esta expectativa.`;
      conclusion = "Desempeño conceptual y flexibilidad dentro de la norma.";
    } else {
      if (zScore > 0) {
        explicacion = `El rango común es de ${rango}. Completar ${resultado} está por encima del promedio poblacional de su edad.`;
        conclusion = "Flexibilidad cognitiva superior a la esperada.";
      } else {
        explicacion = `La mayoría de personas de ${edad} años logra entre ${rango}. El estudiante completó menos categorías de las esperadas.`;
        conclusion = clasificacion === "Límite" 
          ? "Rendimiento en el límite inferior esperado, sugiere leve inflexibilidad."
          : "Rendimiento deficiente, marcada dificultad para la formación de conceptos.";
      }
    }
  } else {
    // Errores Perseverativos (Menor es mejor)
    if (clasificacion === "Normal") {
      explicacion = `Es normal cometer entre ${rango} errores en esta edad. El resultado está dentro del margen esperado.`;
      conclusion = "Nivel de perseveración dentro de los límites normales.";
    } else {
      if (zScore < 0) {
        // Mejor que la media
        explicacion = `La norma está entre ${rango} errores. Haber cometido solo ${resultado} demuestra muy buena adaptación a los cambios.`;
        conclusion = "Baja perseveración, denotando muy buena plasticidad cognitiva.";
      } else {
        // Peor que la media (muchos errores)
        explicacion = `La mayoría comete entre ${rango} errores. Este resultado está por encima.`;
        conclusion = clasificacion === "Límite"
          ? "Tendencia límite hacia la perseveración al cambiar reglas."
          : "Alta inflexibilidad, el estudiante se atasca reiteradamente en patrones previos (Error Perseverativo patológico).";
      }
    }
  }
  
  return {
    resultado: typeof resultado === 'number' && !Number.isInteger(resultado) ? resultado.toFixed(1) : resultado.toString(),
    rangoNormal: rango,
    interpretacion: clasificacion,
    explicacionSimple: explicacion,
    conclusion: conclusion
  };
}
