# 📋 EJEMPLO DE CARGA - SISTEMA DE CONSOLIDACIÓN

## 🎯 Escenario: "Cena de Amigos"
**Objetivo**: Probar el sistema de consolidación con un caso realista donde Eva puede pagar las deudas de otros.

---

## 👥 PASO 1: Crear Evento y Participantes

### Crear Evento:
- **Nombre**: "Cena de Cumpleaños de María"
- **Fecha**: Hoy
- **Moneda**: ARS
- **Estado**: Activo (inicialmente)

### Agregar Participantes:
1. **Eva** - La que va a consolidar pagos (tiene buena situación económica)
2. **Bob** - Debe dinero pero Eva pagará por él
3. **Carlos** - Debe dinero pero Eva pagará por él  
4. **María** - La cumpleañera (pagó algunos gastos)
5. **Diego** - Pagó algunos gastos, debe recibir dinero

---

## 💸 PASO 2: Registrar Gastos

### Gasto 1: Restaurante (pagó María)
- **Descripción**: "Cena en restaurante"
- **Monto**: $45,000
- **Pagador**: María
- **División**: Entre todos (5 personas = $9,000 c/u)

### Gasto 2: Bebidas (pagó Diego)
- **Descripción**: "Vinos y bebidas"
- **Monto**: $18,000
- **Pagador**: Diego
- **División**: Entre todos (5 personas = $3,600 c/u)

### Gasto 3: Postres (pagó Eva)
- **Descripción**: "Torta de cumpleaños"
- **Monto**: $12,000
- **Pagador**: Eva
- **División**: Entre todos (5 personas = $2,400 c/u)

---

## 🧮 PASO 3: Análisis de Balances

### Cálculos Esperados:
**Total gastado**: $75,000  
**Por persona**: $15,000 cada uno

### Balances individuales:
- **Eva**: Pagó $12,000 - Debe $15,000 = **Debe $3,000**
- **Bob**: Pagó $0 - Debe $15,000 = **Debe $15,000**
- **Carlos**: Pagó $0 - Debe $15,000 = **Debe $15,000**
- **María**: Pagó $45,000 - Debe $15,000 = **Recibe $30,000**
- **Diego**: Pagó $18,000 - Debe $15,000 = **Recibe $3,000**

### Liquidaciones Automáticas Originales:
1. **Eva** → **María**: $3,000
2. **Bob** → **María**: $15,000  
3. **Carlos** → **María**: $12,000
4. **Carlos** → **Diego**: $3,000

---

## ✅ PASO 4: Completar Evento
- Cambiar estado del evento a **"COMPLETED"**
- El botón "Consolidar" debe aparecer ahora

---

## 🔄 PASO 5: Probar Consolidación

### Escenario de Consolidación:
**Eva se ofrece a pagar las deudas de Bob y Carlos**

### En el Modal de Consolidación:
1. **Para Bob** ($15,000 en deudas):
   - Seleccionar que **Eva** pagará por Bob

2. **Para Carlos** ($15,000 en deudas):
   - Seleccionar que **Eva** pagará por Carlos

### Liquidaciones Consolidadas Esperadas:
1. **Eva** → **María**: $33,000 ($3,000 propios + $15,000 de Bob + $15,000 de Carlos)
2. **Eva** → **Diego**: $3,000 (la deuda de Carlos hacia Diego)

**Total que Eva paga**: $36,000  
**Bob y Carlos**: $0 (Eva paga por ellos)

---

## 🎭 PASO 6: Casos de Prueba

### Probar Toggle de Vistas:
- **Vista Original**: Mostrar las 4 liquidaciones originales
- **Vista Consolidada**: Mostrar solo 2 liquidaciones consolidadas
- Botón "Limpiar Consolidaciones" debe volver al estado original

### Probar Validaciones:
- ¿Qué pasa si nadie puede pagar por alguien más?
- ¿Funciona con consolidaciones parciales?
- ¿Los montos cuadran correctamente?

---

## 🔍 PUNTOS A VERIFICAR

### Funcionalidad:
- ✅ Botón consolidar solo en eventos COMPLETED
- ✅ Modal se abre correctamente
- ✅ Se pueden asignar pagadores
- ✅ Los cálculos son correctos
- ✅ Toggle entre vistas funciona
- ✅ No hay errores de keys

### UX/UI:
- ¿Es intuitivo el proceso?
- ¿Los textos son claros?
- ¿Los colores y estilos son apropiados?
- ¿Falta alguna confirmación o advertencia?

### Edge Cases:
- ¿Qué pasa si alguien debe dinero pero también debe recibir?
- ¿Funciona con montos pequeños/decimales?
- ¿Se mantiene la consolidación al reabrir el modal?

---

## 📝 RESULTADOS ESPERADOS

Después de la consolidación:
- **Eva ve**: 2 liquidaciones por $36,000 total
- **Bob y Carlos ven**: No deben nada (Eva paga por ellos)
- **María y Diego ven**: Reciben de Eva en lugar de múltiples personas
- **Sistema**: Las matemáticas cuadran perfectamente

---

¡Prueba este flujo y dime qué encuentras! 🚀