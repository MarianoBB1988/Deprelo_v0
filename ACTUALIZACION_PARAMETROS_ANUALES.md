# Actualización del Sistema de Amortizaciones - Parámetros Anuales

## Cambios Realizados

### 1. Backend - Servicio de Amortizaciones
**Archivo:** `lib/services/amortizacion.service.ts`

- **Nuevo método:** `calcularAmortizacionesLogicaConParametros()`
  - Ahora utiliza `ParametroAnualService` para obtener parámetros específicos del año
  - Calcula amortizaciones usando tasas y factores de la DGI para Uruguay
  - Aplica ajustes por inflación según el año seleccionado

- **Nuevo método:** `calcularAmortizacionesMasivas()`
  - Permite cálculo en lote para múltiples activos
  - Acepta parámetros: `año`, `mes` (opcional), `activo_id` (opcional), `metodo`

### 2. API Route - Endpoint de Amortizaciones  
**Archivo:** `app/api/amortizaciones/route.ts`

- **POST actualizado:** Ahora acepta JSON body con:
  - `año` (requerido) - Año para el cual calcular
  - `mes` (opcional) - Mes específico o todos los meses
  - `activo_id` (opcional) - Activo específico o todos los activos
  - `metodo` (opcional) - "automatico" o "recalcular"

### 3. Frontend - Vista de Amortizaciones
**Archivo:** `components/amortizaciones/amortizaciones-view.tsx`

- **Función actualizada:** `handleCalcularAmortizaciones()`
  - Ahora envía POST con JSON body en lugar de query parameters
  - Utiliza endpoint `/api/amortizaciones` en lugar de `/api/amortizaciones/calcular`

- **UI mejorada:**
  - Descripción del diálogo actualizada para mencionar "parámetros anuales DGI Uruguay"
  - Opción de método cambiada a "usar parámetros anuales" en lugar de "configuración de categoría"

## Ventajas del Nuevo Sistema

### 1. Cumplimiento Normativo
- **DGI Uruguay:** Utiliza tasas y parámetros oficiales por año
- **Flexibilidad:** Permite diferentes parámetros para cada año fiscal
- **Auditabilidad:** Cada cálculo registra qué parámetros se utilizaron

### 2. Precisión en Cálculos
- **Inflación:** Aplica factores de inflación específicos del año
- **Tasas variables:** Usa porcentajes de amortización que cambian anualmente
- **Límites dinámicos:** Respeta montos mínimos/máximos según el año

### 3. Gestión Contable
- **Parámetros centralizados:** El contador puede gestionar todos los parámetros desde una interfaz
- **Copia de años:** Facilita configurar nuevos años basados en anteriores
- **Histórico:** Mantiene registro de parámetros utilizados en cada período

## Flujo de Uso

1. **Configuración:** El contador configura parámetros anuales en "Parámetros Anuales"
2. **Cálculo:** Al calcular amortizaciones, el sistema:
   - Obtiene parámetros del año seleccionado
   - Aplica tasas específicas por categoría
   - Calcula usando factores de inflación correspondientes
3. **Resultado:** Las amortizaciones reflejan normativas vigentes para ese año

## Compatibilidad

- ✅ **Backwards Compatible:** Los cálculos existentes no se ven afectados
- ✅ **Database:** Utiliza la tabla `categoria_parametros_anuales` existente
- ✅ **API:** Mantiene compatibilidad con endpoints de consulta existentes
- ✅ **Frontend:** Interfaz mejorada sin cambios disruptivos

## Próximos Pasos Recomendados

1. **Configurar parámetros** para el año actual en la sección "Parámetros Anuales"
2. **Probar cálculos** con diferentes años para verificar funcionamiento
3. **Configurar años futuros** copiando parámetros y ajustando según normativas DGI
