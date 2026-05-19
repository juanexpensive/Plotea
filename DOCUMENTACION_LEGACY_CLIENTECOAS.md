# ClienteCOAS Legacy - Documento de entendimiento funcional para migración a web

## 1. Objetivo de este documento

Este documento resume el funcionamiento real del proyecto legacy `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS` a partir de análisis estático del código y del modelo compartido con `bdCOAS`.

Está pensado para que otra IA, sin abrir el legacy, pueda entender:

- qué pantallas existen
- qué entidades maneja
- qué estados usa
- cómo cambian los permisos de edición según el estado
- cómo se crean, firman, envían y reciben documentos
- qué validaciones de negocio hay que respetar en la migración a web

No es un simple inventario técnico. Está escrito como especificación funcional derivada del código.

## 2. Contexto general

`ClienteCOAS` es un cliente WPF/VB.NET sobre .NET Framework 4.8.

Su dominio principal gira alrededor de:

- trabajos de visado
- trabajos de registro
- documentos asociados a cada trabajo
- arquitectos intervinientes
- promotores
- colaboradores
- firmas digitales
- envíos FTP al COAS
- recepción de resultados y ficheros de vuelta

La lógica importante no está repartida solo en la UI. Se apoya mucho en:

- `bdCOASVD` o `bdCOAS` para entidades y estados
- `Comun.vb` para utilidades funcionales
- `EnlacePKI.vb` para NRL, firma, empaquetado y certificados
- `Envios.vb` para cola de envío
- `Recepcion.vb` para cola de descarga

## 3. Mapa funcional del proyecto legacy

### 3.1 Ventana principal

Archivo principal:

- `dxwInicio.xaml.vb`

Desde aquí se abren:

- `ucTrabajos` para trabajos de visado
- `ucTrabajos` para trabajos de registro
- `ucEntidades` para promotores
- `ucEntidades` para colaboradores
- `ucColegiados`
- `ucEnvios`
- `ucRecepcion`
- `ucPersonalizacion`

Además:

- al arrancar se autentica contra el servicio externo
- mantiene una sesión viva en BD con temporizador cada 30 segundos
- llama a `Recepcion.Recibir(Me, True)` al cargar para detectar descargas pendientes

### 3.2 Pantallas principales por dominio

- `ucTrabajos.xaml.vb`: listado de trabajos
- `ucTrabajo.xaml.vb`: cabecera de un trabajo
- `ucComEncargo.xaml.vb`: comunicación de encargo
- `ucSolRegistro.xaml.vb`: solicitud de registro
- `ucDocumento.xaml.vb`: documento genérico
- `ucDocumentoDesglosado.xaml.vb`: documento desglosado, usado para GUMA
- `ucDocumentoCFO.xaml.vb`: CFO y Anejo 1
- `ucEntidad.xaml.vb`: promotor, colaborador o sociedad proyectista
- `ucColegiado.xaml.vb`: colegiados relacionados y certificados
- `ucEnvios.xaml.vb`: cola de envíos
- `ucRecepcion.xaml.vb`: cola de recepciones

## 4. Modelo de datos funcional

## 4.1 Entidades más importantes

### `Trabajos`

Representa el expediente principal.

Campos relevantes observados:

- `idTrabajo`
- `idColegiadoCreador`
- `idTipoActuacion`
- `idGrupoTrabajo`
- `ClaseTrabajo`
- `DescripcionTrabajo`
- `Domicilio`
- `CodigoPostal`
- `CodigoMunicipio`
- `ReferenciaCatastral`
- `ServicioInterterritorial`
- `NTL`
- `OcultarEnTrabajosRecientes`
- `FechaCreacion`

Relaciones relevantes:

- `Documentos`
- `Municipios`
- `GruposTrabajo`

### `Documentos`

Es la pieza central del proceso.

Campos relevantes observados:

- `idDocumento`
- `idTrabajo`
- `idTipoDocumento`
- `DescripcionTipoDocumento`
- `idEstado`
- `FechaCreacion`
- `FechaVisado`
- `FechaVisadoPapel`
- `Documento`
- `DocumentoExterno`
- `DocumentoExternoAdjunto`
- `DocumentoGeneradoExternamente`
- `DocumentoGeneradoExternamenteAdjunto`
- `Estructura`
- `FicheroEscaneado`
- `ImporteGastos`
- `ReferenciaPagoAnticipado`
- `ImportePagoAnticipado`
- `ReferenciaPagoAnticipadoAsignada`
- `NumeroExpedienteDocumento`
- `NRL`
- `UltimoEnvio`
- `VisadoUrgente`
- `AutorizacionDescargaOrganismos`

Relaciones relevantes:

- `Trabajos`
- `TiposDocumentos`
- `ArqInter`
- `Propiedades`
- `Colaboradores`
- `FicherosColegiados`
- `FicherosColegio`

### `ArqInter`

Define arquitectos intervinientes y sus porcentajes por fase.

Campos funcionales importantes:

- `idColegiado`
- `idTipoIntervencion`
- `idSdad`
- `PorcentajeCOOSS`
- `PorcentajeDIREEJEC`
- `PorcentajeDIREOBRA`
- `PorcentajeESSEBSS`
- `PorcentajeFUNICA`
- `PorcentajePBASICO`
- `PorcentajePEJECUCION`
- `PorcentajePROYECTO`
- `PorcentajeIntervencion`

### `Propiedades`

En la práctica, aquí se modelan los promotores enlazando una entidad con porcentaje de participación.

Campos importantes:

- `idEntidad`
- `Participacion`

### `Entidades`

Se reutiliza para:

- promotores
- colaboradores
- sociedades proyectistas

Campos funcionales relevantes:

- `CIF`
- `RazonSocial`
- `Domicilio`
- `Poblacion`
- `Provincia`
- `CodigoPostal`
- `Representante`
- `CIFRepresentante`
- `RepresentanteComo`
- `Email`
- `Telefono1`
- `idTipoDomicilio`
- `idPais`
- `NumeroColegiadoSdad`
- `idColegioResidenciaSdad`
- flags `EsPromotor`, `EsColaborador`, `EsProyectista`

### `FicherosColegiados`

Representa la versión enviada o firmable de un documento del colegiado.

Campos relevantes:

- `idFicheroColegiado`
- `NumeroFichero`
- `idEstado`
- `FechaGeneracion`
- `FechaEnvio`
- `HashFichBase1`
- `HashFichBase2`
- `BloqueFirma`
- `MedioEnvio`
- `idColegiadoEnviador`

Relaciones:

- `Firmantes`

### `FicherosColegio`

Representa ficheros generados o puestos a disposición por COAS:

- documento visado o registrado
- factura
- nota de visado
- aviso de cobro

Tipos observados por código:

- `TFCOAS.DOCVIS`
- `TFCOAS.FRA`
- `TFCOAS.NV`
- `TFCOAS.AC`

## 4.2 Tipos de actuación del trabajo

En `bdCOAS\extensiones\Trabajos.cs`:

- `VISADO = 1`
- `REGISTRO = 3`

Consecuencia funcional:

- los trabajos de visado arrancan con comunicación de encargo como documento base
- los trabajos de registro arrancan con solicitud de registro como documento base

## 4.3 Estados de documento

En `bdCOAS\Estados.cs`:

| Valor | Estado |
|---|---|
| 1 | `ANULADO` |
| 2 | `EN_PREPARACION` |
| 3 | `FALTA_ALGUNA_FIRMA` |
| 4 | `PENDIENTE_ENVIO` |
| 5 | `ENVIANDO_O_EN_COLA` |
| 6 | `ERROR_EN_ENVÍO` |
| 7 | `PENDIENTE_VISADO` |
| 8 | `CAJA` |
| 9 | `VISADO` |
| 10 | `PENDIENTE_POR_NOTA_VISADO` |
| 11 | `ERROR_FICHERO_RECIBIDO_CORRUPTO` |
| 12 | `VISADO_SIN_FICHERO_FIRMADO` |

Interpretación funcional real:

- `EN_PREPARACION`: documento editable
- `FALTA_ALGUNA_FIRMA`: al menos un firmante ya firmó, pero faltan otros
- `PENDIENTE_ENVIO`: ya está completamente firmado y listo para enviar
- `ENVIANDO_O_EN_COLA`: ya entró en la cola de FTP
- `ERROR_EN_ENVÍO`: el FTP falló; puede reintentarse
- `PENDIENTE_VISADO`: ya llegó al COAS y se está tramitando
- `PENDIENTE_POR_NOTA_VISADO`: vuelve a abrirse para corrección tras nota
- `ERROR_FICHERO_RECIBIDO_CORRUPTO`: vuelve a abrirse porque lo recibido es inválido o corrupto
- `VISADO`: fin correcto del ciclo
- `VISADO_SIN_FICHERO_FIRMADO`: fin correcto, pero no existe el fichero firmado final descargable
- `ANULADO`: cerrado por anulación

Matiz importante:

- En la capa de presentación compartida, para trabajos de registro, los estados `PENDIENTE_VISADO`, `VISADO` y `VISADO_SIN_FICHERO_FIRMADO` se muestran semánticamente como registro, no como visado.

## 4.4 Estados de fichero colegiado

En `bdCOAS\Estados.cs`:

| Valor | Estado |
|---|---|
| 47 | `PENDIENTE_FIRMA` |
| 62 | `FIRMADO_FALTA_ALGUNA_FIRMA` |
| 50 | `FIRMADO_PENDIENTE_CONF_ENVIO` |
| 61 | `ENCOLADO_O_ENVIANDOSE` |
| 52 | `ENVIADO` |

Interpretación funcional:

- `PENDIENTE_FIRMA`: todavía no hay bloque de firma válido para ese envío
- `FIRMADO_FALTA_ALGUNA_FIRMA`: hay firma parcial
- `FIRMADO_PENDIENTE_CONF_ENVIO`: todas las firmas necesarias están, pero falta confirmar o lanzar el envío
- `ENCOLADO_O_ENVIANDOSE`: ya pasó a la cola FTP
- `ENVIADO`: transferencia realizada

## 4.5 Estados de la cola de envío

En `bdCOAS\Estados.cs`:

| Valor | Estado |
|---|---|
| 0 | `FALTA_FICHERO_ORIGINAL` |
| 1 | `PENDIENTE_ENVIO` |
| 2 | `PENDIENTE_CONFIRMACION_ENVIO` |
| 3 | `CREANDO_FICHERO_FIRMADO` |
| 4 | `CREANDO_FICHERO_ENCRIPTADO` |
| 5 | `ENVIANDO` |
| 6 | `ENVIADO` |
| 8 | `ERROR_EN_EL_ENVÍO` |

## 4.6 Estados de recepción

En `Recepcion.vb`:

| Valor | Estado |
|---|---|
| 0 | `PREPARANDO_LA_DESCARGA` |
| 1 | `PENDIENTE_RECEPCION` |
| 2 | `RECIBIENDO` |
| 3 | `RECIBIDO` |
| 4 | `ERROR_EN_LA_RECEPCION` |
| 5 | `CANCELADO` |

## 5. Regla maestra de editabilidad

Esta es la regla más importante para migrar.

## 5.1 Editabilidad del trabajo

Un trabajo completo solo es editable si se cumple una de estas condiciones:

- no tiene documentos
- no tiene ninguna comunicación de encargo ni solicitud de registro
- sí tiene comunicación de encargo o solicitud de registro, pero al menos una está en uno de estos estados:
  - `EN_PREPARACION`
  - `PENDIENTE_POR_NOTA_VISADO`
  - `ERROR_FICHERO_RECIBIDO_CORRUPTO`

Si no se cumple, `ucTrabajo` pasa a solo lectura.

Consecuencia práctica:

- campos como calle, código postal, municipio, clase de trabajo, grupo, etc. se pueden cambiar mientras la CE o la SR siga editable
- una vez que la CE o SR pasa a firma, pendiente de envío, enviado o visado, el trabajo deja de poder tocarse desde su cabecera

Además:

- el botón de eliminar trabajo solo se habilita si ningún documento del trabajo tiene `NRL` ni `NumeroExpedienteDocumento`
- aunque se intente eliminar, se bloquea si ya hay documentos enviados o referencias de pago asignadas

## 5.2 Editabilidad de documentos

Patrón general en `ucDocumento`, `ucComEncargo`, `ucSolRegistro`, `ucDocumentoDesglosado` y `ucDocumentoCFO`:

- `EN_PREPARACION`: editable
- `PENDIENTE_POR_NOTA_VISADO`: editable
- `ERROR_FICHERO_RECIBIDO_CORRUPTO`: editable
- `FALTA_ALGUNA_FIRMA`: no editable, pero se puede eliminar firmas
- `PENDIENTE_ENVIO`: no editable, se puede enviar y eliminar firmas
- `ERROR_EN_ENVÍO`: no editable, se puede reintentar envío y eliminar firmas
- `PENDIENTE_VISADO`, `VISADO`, `VISADO_SIN_FICHERO_FIRMADO`, `ANULADO`, `CAJA`, `ENVIANDO_O_EN_COLA`: solo lectura

Esto es exactamente la transición mental que hay que reproducir en web.

## 6. Flujo de trabajo principal

## 6.1 Alta de trabajo

Pantalla:

- `ucTrabajo`

Al crear un trabajo:

- se crea un `Trabajos`
- `idColegiadoCreador = Comun.idColegiado`
- si se abrió desde trabajos de visado, `idTipoActuacion = TIPTRA.VISADO`
- si se abrió desde trabajos de registro, `idTipoActuacion = TIPTRA.REGISTRO`
- `FechaCreacion = ahora SQL Server`

Validaciones clave:

- código postal español de 5 dígitos
- si hay varios municipios para un CP, se obliga a elegir
- si el trabajo es de visado y la provincia no es Sevilla, puede activarse `ServicioInterterritorial`
- si la provincia es Sevilla o el trabajo no es de visado, `ServicioInterterritorial` se fuerza a no activo

## 6.2 Listado de trabajos

Pantalla:

- `ucTrabajos`

Funciones observadas:

- listado de visado o registro según la entrada
- apertura de ficha de trabajo
- apertura directa de documentos desde rejilla
- edición rápida de:
  - `DescripcionTrabajo`
  - `OcultarEnTrabajosRecientes`

## 6.3 Creación del primer documento

Regla:

- en trabajos de visado, el primer documento forzado es la `COMUNICACION_ENCARGO`
- en trabajos de registro, el primer documento forzado es la `SOLICITUD_DE_REGISTRO`

Solo cuando ese documento base ya existe, el usuario puede elegir otros tipos con `dxwSeleccionarTipoDocumento`.

## 6.4 Nuevo documento como clon de contexto

Esta es otra regla crítica.

Al crear un documento nuevo, el sistema rara vez parte de cero.

Patrones observados:

- `ucDocumento`, `ucDocumentoDesglosado` y `ucDocumentoCFO` clonan la última CE o SR válida del trabajo
- `ucComEncargo` y `ucSolRegistro` clonan la última versión del trabajo

Qué se hereda normalmente:

- arquitectos intervinientes
- promotores
- colaboradores
- porcentajes
- relaciones de sociedad

Qué se limpia al clonar:

- `idTipoDocumento` si procede
- `NRL`
- `NumeroExpedienteDocumento`
- `CodigoVerificacionSeguro`
- `FechaVisado`
- `FechaVisadoPapel`
- binarios o rutas de documento previo
- estructura serializada
- importes de pago
- `UltimoEnvio`
- `VisadoUrgente`
- `idTipoDocumentoCOAS`

Esto significa que la migración web no debe modelar “nuevo documento” como registro vacío puro, sino como “nueva versión derivada del contexto vigente del trabajo”.

## 7. Comunicación de encargo

Pantalla:

- `ucComEncargo`

Es el documento base del flujo de visado.

## 7.1 Reglas de unicidad

Solo se permite crear una nueva CE si no existe otra del mismo tipo en estado activo pendiente:

- no se deja abrir una CE nueva si existe otra del mismo tipo que no esté:
  - `VISADO`
  - `VISADO_SIN_FICHERO_FIRMADO`
  - `ANULADO`

Mensaje funcional:

- si hay una CE pendiente o editable, hay que modificar esa, no crear otra.

## 7.2 Validaciones de negocio de CE

Antes de guardar:

- si el arquitecto interviene como técnico redactor o director, debe indicar sociedad proyectista
- si no interviene en ese tipo, no debe rellenar sociedad proyectista
- si `ServicioInterterritorial = true`, el CP no puede ser de Sevilla o vacío
- la suma `CosteArquitecto + CostePromotor` debe ser 100
- la suma por cada fase visible entre todos los arquitectos debe ser 100 o 0
- cada arquitecto debe participar en al menos una fase
- el colegiado actual debe participar en alguna fase
- debe existir al menos un promotor
- la suma de participación de promotores debe ser 100
- si existe porcentaje en `FUNICA`, es obligatorio rellenar otras fases
- si no existe porcentaje en `FUNICA`, no debe haber otras fases informadas
- el tipo de intervención de cada arquitecto es obligatorio
- si algún arquitecto es colaborador (`TI.CO`), entonces son obligatorios:
  - `NombreProyectistaYODirector`
  - `TitulacionProyectistaYODirector`
  - `DescripcionTrabajoProyectistaYODirector`
- si no hay colaborador, esos campos no deben rellenarse

Validación cruzada muy importante:

- para cada documento pendiente del mismo trabajo distinto de la propia CE, si ese tipo documental requiere una fase, la CE debe tener al menos un arquitecto con porcentaje en dicha fase

Ejemplos:

- si existe un documento que requiere `DIREOBRA`, la CE debe tener algún `PorcentajeDIREOBRA > 0`
- si requiere `PBASICO`, alguien debe tener `PorcentajePBASICO > 0`

## 7.3 Efecto de modificar la CE sobre otros documentos

Después de guardar la CE:

- compara la lista de arquitectos de la CE con la de los documentos pendientes del mismo trabajo
- si la lista de colegiados no coincide, el sistema resetea esos documentos pendientes:
  - borra `ArqInter`
  - borra `Propiedades`
  - borra `FicherosColegiados` no enviados
  - recrea arquitectos, colaboradores y promotores desde la CE
  - limpia firmas pendientes
  - pone el documento en `EN_PREPARACION`

Esto tiene una implicación de migración muy fuerte:

- la CE es la fuente maestra de reparto de intervinientes para los documentos derivados del trabajo

## 7.4 Firma de la CE

Para firmar:

- si tiene `NumeroExpedienteDocumento` pero no `NRL`, se considera expediente iniciado en papel y no se deja firmar
- si no hay escaneo manuscrito (`FicheroEscaneado`), avisa pero permite continuar
- se genera registro de fichero a firmar
- si hace falta, se genera el PDF de CE
- se obtiene NRL
- se firma el PDF más documentación adjunta

Si cambió la composición de arquitectos respecto a otros documentos pendientes, al firmar también resetea firmas de esos documentos pendientes.

## 7.5 Botones y estados en CE

### Estado `EN_PREPARACION`, `PENDIENTE_POR_NOTA_VISADO`, `ERROR_FICHERO_RECIBIDO_CORRUPTO`

- guardar habilitado
- generar PDF habilitado
- eliminar firmas deshabilitado
- enviar deshabilitado
- edición permitida

### Estado `FALTA_ALGUNA_FIRMA`

- guardar habilitado
- generar PDF deshabilitado
- eliminar firmas habilitado
- enviar deshabilitado
- pantalla en solo lectura

### Estado `PENDIENTE_ENVIO`, `ERROR_EN_ENVÍO`

- guardar deshabilitado
- generar PDF deshabilitado
- eliminar firmas habilitado
- enviar habilitado
- solo lectura

### Estado final o no editable

- guardar deshabilitado
- generar PDF deshabilitado
- eliminar deshabilitado
- enviar deshabilitado
- solo lectura

## 8. Solicitud de registro

Pantalla:

- `ucSolRegistro`

Es el documento base del flujo de registro.

## 8.1 Reglas de unicidad

- solo puede existir una solicitud de registro por trabajo

## 8.2 Validaciones específicas

Antes de guardar:

- debe existir al menos un arquitecto interviniente
- el colegiado actual debe estar entre los intervinientes
- cada arquitecto debe tener `PorcentajeFUNICA > 0`
- `PorcentajeIntervencion` se rellena con `PorcentajeFUNICA`
- `DescripcionTipoDocumento` se fuerza a la descripción del tipo

A diferencia de la CE:

- la SR funciona como un trabajo de participación única, no por conjunto complejo de fases

## 8.3 Comportamiento administrativo G2/G5

En la SR hay lógica de interfaz por grupo:

- si `GruposTrabajo.Codigo = G2`, se ocultan controles G5
- si `GruposTrabajo.Codigo = G5`, se ocultan controles G2
- si no es ninguno, ambos bloques se ocultan

Además, hay un selector entre:

- aprobación administrativa
- tramitación administrativa

Cuando se elige uno:

- se activa un bloque de campos
- se desactiva el otro
- se limpian campos incompatibles

## 8.4 Sincronización con otros documentos del trabajo

Después de guardar la SR:

- recorre documentos pendientes del trabajo distintos de la propia SR
- si la lista de arquitectos difiere, borra y rehace `ArqInter`, `Propiedades`, `Colaboradores` y `FicherosColegiados` no enviados

Es la misma idea que la CE:

- la SR es la fuente maestra del reparto cuando el trabajo es de registro

## 8.5 Botones y estados en SR

### `EN_PREPARACION`

- guardar sí
- generar PDF sí
- eliminar firmas no
- enviar no
- editable

### `FALTA_ALGUNA_FIRMA`

- guardar no
- generar PDF no
- eliminar firmas sí
- enviar no
- solo lectura

### `PENDIENTE_ENVIO`

- guardar no
- generar PDF no
- eliminar firmas sí
- enviar sí
- solo lectura

### resto

- todo deshabilitado
- solo lectura

## 9. Documento genérico

Pantalla:

- `ucDocumento`

Es el flujo más rico y el más importante para migrar.

## 9.1 Tipos documentales

El usuario no crea directamente cualquier tipo.

El selector `dxwSeleccionarTipoDocumento` filtra por:

- `idGrupoTrabajo`
- `GrupoIntermedio = false`
- `FechaBaja` salvo excepciones
- configuración de CFO activa o no

Clases funcionales observadas:

- `COMUNICACION_ENCARGO`
- `SOLICITUD_DE_REGISTRO`
- `ADHESION_GUMA`
- `CFO`
- `ANEJO_1`
- resto de documentos genéricos

## 9.2 Herramientas de generación

El documento puede generarse de dos formas:

- herramienta COAS: construye PDF a partir de `EstructuraDocumentoBase` y ficheros sueltos
- herramienta externa: el usuario aporta un PDF principal y opcionalmente un adjunto

Campos y flags relacionados:

- `DocumentoGeneradoExternamente`
- `DocumentoExterno`
- `DocumentoGeneradoExternamenteAdjunto`
- `DocumentoExternoAdjunto`

## 9.3 Estructura documental

La estructura del documento se carga desde `EstructuraDocumentoBase` según `idTipoDocumento`.

Cada nodo puede marcar:

- apartado
- descripción
- obligatorio
- requiere firma de propietarios
- si es no sellable

La estructura rellenada se serializa en `Documentos.Estructura`.

## 9.4 Reglas de creación

En trabajos de registro:

- solo se permite un documento distinto de la solicitud de registro por trabajo

Para GUMA:

- se permite según configuración `CONF.GTGUMA`
- solo en grupos admitidos
- solo si el municipio del trabajo es Sevilla capital
- avisa si ya hay un AD.GUMA pendiente

Para CFO y Anejo 1:

- se permite según configuración `CONF.GTCFO`
- solo en grupos admitidos
- no se deja crear si ya hay uno pendiente del mismo tipo
- exige que exista porcentaje de `DIREOBRA` en el último documento maestro del trabajo

## 9.5 Validaciones antes de guardar

`ucDocumento` valida:

- si el tipo pide descripción (`PedirDescripcion`), `DescripcionTipoDocumento` es obligatoria
- el grupo de trabajo no puede haber cambiado respecto al trabajo en BD
- serializa la estructura con los ficheros elegidos

## 9.6 Pago y referencia de pago

Aplica sobre todo a documentos de registro.

Lógica observada:

- si `ReferenciaPagoAnticipado = ReferenciaPagoAnticipadoAsignada`, se bloquean edición de referencia e importe
- si hay URL de pago configurada (`CONF.URLPAGO`), se usa pago web
- si no, usa la URL legacy de prepago con digito de control
- no se deja firmar si tiene gastos y no hay pago válido
- si el importe calculado no coincide con el pagado, avisa

Consecuencia funcional:

- una vez asignada una referencia efectiva, el bloque de pago queda congelado

## 9.7 Visado urgente

Solo para visado, con reglas:

- municipio obligatorio
- no disponible fuera de la provincia de Sevilla
- para generarlo, debe existir una CE válida y enviada o ya visada
- además debe haber datos de propiedad

Al generar PDF con adjunto:

- si `VisadoUrgente = true`, añade el PDF de solicitud urgente al adjunto o lo genera como adjunto si no había más

## 9.8 Firma del documento genérico

Flujo observado:

1. guarda cambios
2. si no existe `NRL` o cambió la referencia de pago, llama a `CompruebaNTLyNRL`
3. si procede, genera PDF principal y adjunto
4. calcula gastos
5. verifica pago si es documento de registro
6. llama a `EnlacePKI.FirmarClick`

Casos bloqueantes:

- si viene de expediente en papel (`NumeroExpedienteDocumento` con `NRL` vacío), no firma
- si faltan documentos obligatorios, no firma
- si el fichero base firmado cambió tras firmas parciales, obliga a eliminar firmas y rehacer

## 9.9 Botones y estados en documento genérico

### `EN_PREPARACION`, `PENDIENTE_POR_NOTA_VISADO`, `ERROR_FICHERO_RECIBIDO_CORRUPTO`

- guardar sí
- generar PDF sí
- eliminar firmas no
- enviar no
- limpiar destino sí
- eliminar fichero sí
- drag and drop sí
- herramienta interna/externa seleccionable sí
- descripción editable según `DescripcionTipoDocumentoModificable`

### `FALTA_ALGUNA_FIRMA`, `PENDIENTE_ENVIO`, `ERROR_EN_ENVÍO`

- guardar no
- generar PDF no
- eliminar firmas sí
- enviar sí
- drag and drop no
- no se puede tocar adjuntos
- herramienta interna/externa bloqueada
- pantalla en solo lectura

### resto

- todo deshabilitado
- solo lectura

## 10. Documento desglosado GUMA

Pantalla:

- `ucDocumentoDesglosado`

Es un flujo especial de documento con desglose de ficheros.

Comportamiento relevante:

- al crear, clona CE o SR vigente
- reinicia NRL, importes, CVE y binarios
- carga `FicherosDelDocumento` desde `EstructuraDocumentoBase`
- usa el mismo ciclo:
  - generar registro de fichero
  - firmar ZIP
  - enviar
  - recibir

Botonera por estado:

- `EN_PREPARACION`, `PENDIENTE_POR_NOTA_VISADO`, `ERROR_FICHERO_RECIBIDO_CORRUPTO`: se puede guardar y adjuntar fichero
- `FALTA_ALGUNA_FIRMA`, `PENDIENTE_ENVIO`, `ERROR_EN_ENVÍO`: solo eliminar firmas y enviar
- resto: solo lectura

## 11. CFO y Anejo 1

Pantalla:

- `ucDocumentoCFO`

Prácticamente replica el patrón del documento desglosado:

- clona CE o SR
- monta `FicherosDelDocumento`
- firma ZIP
- envía

Reglas específicas observadas:

- acceso condicionado por `CONF.GTCFO`
- solo grupos admitidos
- no crea otro pendiente del mismo tipo

## 12. Cómo se genera NTL y NRL

Lógica en `EnlacePKI.CompruebaNTLyNRL`.

## 12.1 NTL

Si:

- el usuario no viene desde acceso interno COAS
- el trabajo tiene `NTL = "0000"`

Entonces:

- toma el contador del colegiado
- incrementa
- genera `NTL = NumeroInstalacion + "-" + contador con 6 dígitos`
- comprueba unicidad en `Trabajos`

## 12.2 NRL

Se solicita al WCF externo con:

- `idColegiado`
- `NumeroInstalacion`
- `idDocumento`
- referencia de pago
- importe de pago

Al recibirlo:

- se guarda en `Documento.NRL`
- también se actualiza `Trabajo.NTL` con la parte izquierda del NRL
- se marca `ReferenciaPagoAnticipadoAsignada = ReferenciaPagoAnticipado`

Esto es muy importante:

- `NRL` no es solo un código de salida; redefine también el identificador operativo del trabajo

## 13. Cómo se preparan firmas y envíos

## 13.1 Generación de registro de fichero a firmar

`EnlacePKI.GenerarRegistroFicheroAFirmar` hace esto:

- si no existen `FicherosColegiados` o el último ya fue enviado, crea uno nuevo
- `NumeroFichero` = último + 1
- `idEstado = PENDIENTE_FIRMA`
- crea firmantes desde `ArqInter`
- pone `UltimoEnvio`

Si ya existe uno sin hash base:

- borra firmantes y los regenera desde los arquitectos actuales

## 13.2 Firma

Hay dos variantes:

- `FirmarClick` para PDF clásico
- `FirmarZIP` para documento desglosado o CFO

Regla de transición:

- si ya no quedan firmantes pendientes:
  - fichero pasa a `FIRMADO_PENDIENTE_CONF_ENVIO`
  - documento pasa a `PENDIENTE_ENVIO`
- si faltan firmantes:
  - fichero pasa a `FIRMADO_FALTA_ALGUNA_FIRMA`
  - documento pasa a `FALTA_ALGUNA_FIRMA`

Además:

- `Firmante.HaFirmado = true`

## 13.3 Eliminar firmas

En todos los tipos documentales existe acción de “desbloquear”:

- pone `FicheroColegiado.idEstado = PENDIENTE_FIRMA`
- borra `BloqueFirma`
- borra hashes base
- pone `Documento.idEstado = EN_PREPARACION`
- pone todos los firmantes `HaFirmado = false`
- elimina el `.fir` local
- saca el elemento de la cola de envíos si existía

Interpretación:

- eliminar firmas revierte el documento a edición total

## 14. Cola de envío

Módulo:

- `Envios.vb`

## 14.1 Qué entra en la cola

Al abrir `ucEnvios` o llamar a `Envios.Enviar`:

- busca `FicherosColegiados` del colegiado con estado:
  - `FIRMADO_PENDIENTE_CONF_ENVIO`
  - `ENCOLADO_O_ENVIANDOSE`
- los convierte a `FicheroEnvio`

Mapeo funcional:

- `FIRMADO_PENDIENTE_CONF_ENVIO` -> `PENDIENTE_CONFIRMACION_ENVIO`
- `ENCOLADO_O_ENVIANDOSE` -> `PENDIENTE_ENVIO` o `FALTA_FICHERO_ORIGINAL` según exista el zip local

Además:

- si encuentra documentos en `ERROR_EN_ENVÍO`, los recoloca como:
  - documento -> `PENDIENTE_ENVIO`
  - fichero -> `ENCOLADO_O_ENVIANDOSE`

## 14.2 Confirmación de envío

En `ucEnvios`, el usuario puede lanzar “iniciar envíos”.

Para los ficheros `PENDIENTE_CONFIRMACION_ENVIO`:

- se vuelve a validar con `CompruebaListoEnvio`
- si confirma, el documento pasa a `PENDIENTE_ENVIO`
- el fichero pasa a `ENCOLADO_O_ENVIANDOSE`
- la cola local pasa a `PENDIENTE_ENVIO`

Interpretación:

- la firma completa no envía automáticamente
- hay un paso explícito de confirmación o lanzamiento del envío

## 14.3 Validaciones previas al envío

`Envios.CompruebaListoEnvio` es crítica.

Antes de enviar un documento:

- debe existir CE o SR
- CE o SR debe estar enviada, visada, registrada, corregible o anulada según los casos admitidos
- si hay una CE o SR pendiente de envío real, bloquea el envío del resto
- para ciertos documentos relacionados con salud y ejecución, exige que antes exista y esté enviado un proyecto de ejecución o básico+ejecución
- si los porcentajes del documento están a cero, intenta copiar los porcentajes de la última CE/SR
- si sigue todo a cero, bloquea

Conclusión funcional:

- no se puede enviar libremente cualquier documento aislado
- siempre depende del documento maestro del trabajo y de la coherencia de fases

## 14.4 Envío FTP real

`TransmiteFich` hace:

1. marca `FicheroEnvio.Estado = ENVIANDO`
2. pone `Documento.idEstado = ENVIANDO_O_EN_COLA`
3. crea `.fir` y `.fco`
4. sube por FTP
5. verifica hash remoto vía WCF
6. si va bien:
   - `Documento.idEstado = PENDIENTE_VISADO`
   - `FicheroColegiado.idEstado = ENVIADO`
   - `FechaEnvio = ahora`
   - `MedioEnvio = FTP`
7. si falla:
   - `FicheroEnvio.Estado = ERROR_EN_EL_ENVÍO`
   - incrementa contador de errores
   - tras 10 errores, pausa y fuerza reinicio

## 14.5 Cancelar o detener envío

Desde `ucEnvios`:

- detener: cancela y deja en `PENDIENTE_ENVIO`, además lo pausa
- cancelar: revierte a:
  - documento `PENDIENTE_ENVIO`
  - fichero `FIRMADO_PENDIENTE_CONF_ENVIO`
  - cola `PENDIENTE_CONFIRMACION_ENVIO`

Eso significa:

- cancelar envío no borra la firma
- simplemente vuelve al estado “firmado pero sin confirmar”

## 15. Recepción de documentos del COAS

Módulo:

- `Recepcion.vb`

## 15.1 Qué se recibe

Dos familias:

- `FicherosColegioSolicitados`
  - documento visado/registrado
  - factura
  - nota de visado
  - aviso de cobro
- `FicherosColegiadosSolicitados`
  - original firmado del colegiado

## 15.2 Tipos de fichero recibidos

Rutas lógicas observadas:

- `TFCOAS.DOCVIS` -> documento final visado o registrado
- `TFCOAS.FRA` -> factura
- `TFCOAS.NV` -> nota de visado
- `TFCOAS.AC` -> aviso de cobro
- originales de colegiado -> `.fir`

## 15.3 Flujo de descarga

1. `ActualizaFicherosPendientesDeRecibir` consulta solicitudes pendientes
2. crea lista local `FicherosARecibir`
3. cada elemento tiene:
   - origen FTP
   - destino local
   - estado de recepción
4. `RecibeFich` descarga el fichero
5. verifica hash
6. mueve el `.tmp` a definitivo
7. marca `FechaDescarga` en la tabla de solicitudes

## 15.4 Filtro especial de facturas y avisos

Para facturas y avisos:

- no basta con que sean del documento
- filtra para no mostrar facturas o avisos destinados a otros colegiados del mismo trabajo

## 15.5 Relación con la UI

Cuando el usuario intenta abrir un fichero no descargado:

- se crea una solicitud en BD
- se le avisa de que podrá verlo cuando termine la descarga
- el seguimiento se hace en “Recepción de Documentos”

## 16. Reglas de apertura y solicitud de ficheros

En `Comun.vb` hay muchas aperturas “inteligentes”.

Patrón general:

- si el fichero ya existe localmente, se abre
- si no existe pero está disponible en COAS, se genera una solicitud de descarga
- si está corrupto, se solicita de nuevo
- si aún no fue enviado y tampoco existe localmente, se informa de que probablemente se generó en otro equipo y hay que regenerarlo

Para migración:

- abrir un fichero no es solo “descargar blob”
- a menudo implica registrar la solicitud y delegar la descarga en un proceso aparte

## 17. Reglas específicas por tipo documental

## 17.1 Comunicación de encargo

- documento maestro del visado
- controla reparto de arquitectos, promotores y colaboradores
- su cambio puede invalidar firmas de otros documentos pendientes

## 17.2 Solicitud de registro

- documento maestro del registro
- solo una por trabajo
- modela participación con `PorcentajeFUNICA`

## 17.3 AD.GUMA

- documento administrativo especial
- solo grupos configurados
- solo Sevilla capital
- conviene tratarlo como flujo propio en web

## 17.4 CFO y Anejo 1

- tipos especiales sobre estructura de documentos
- usan ZIP y firma múltiple
- solo disponibles en grupos configurados

## 17.5 Documento genérico

- usa estructura de apartados
- puede ser generado por herramienta COAS o subido externo
- puede incorporar documentación adjunta y urgente

## 18. Reglas sobre entidades

Pantalla:

- `ucEntidad`

## 18.1 Tipos funcionales

Una entidad puede darse de alta como:

- promotor
- colaborador
- sociedad proyectista

## 18.2 Validaciones clave

- persona física:
  - DNI/NIE obligatorio salvo documento extranjero
  - apellidos obligatorios
  - nombre obligatorio
  - `RazonSocial = "Apellidos, Nombre"`
- persona jurídica:
  - CIF obligatorio salvo documento extranjero
  - razón social obligatoria
- si tiene documento extranjero:
  - país obligatorio
- sociedad proyectista:
  - número de colegiado de sociedad obligatorio
  - colegio de residencia obligatorio
- representante:
  - si el documento parece incorrecto, pregunta si continuar

## 18.3 Reutilización y recuperación

Al introducir DNI o CIF en alta:

- si ya existe para el colegiado actual, puede recuperar la entidad existente

## 18.4 Restricción de borrado

- no se puede eliminar si la entidad ya participa en `ArqInter`, `Propiedades` o `Colaboradores`

## 19. Reglas sobre colegiados relacionados y certificados

Pantalla:

- `ucColegiado`

Función:

- relacionar otros colegiados con el colegiado actual
- importar, generar, renovar y exportar certificados

Validación base:

- el NIF del colegiado hijo debe existir en COAS
- no puede duplicarse la relación para el mismo colegiado padre

## 20. Tabla rápida de decisiones de migración

## 20.1 Cuándo permitir editar un trabajo

Permitir:

- sin CE/SR
- con CE/SR en `EN_PREPARACION`
- con CE/SR en `PENDIENTE_POR_NOTA_VISADO`
- con CE/SR en `ERROR_FICHERO_RECIBIDO_CORRUPTO`

Bloquear:

- con CE/SR firmada, pendiente de envío, enviada, visada, registrada o anulada

## 20.2 Cuándo permitir editar un documento

Permitir:

- `EN_PREPARACION`
- `PENDIENTE_POR_NOTA_VISADO`
- `ERROR_FICHERO_RECIBIDO_CORRUPTO`

Bloquear pero permitir quitar firmas o reenviar:

- `FALTA_ALGUNA_FIRMA`
- `PENDIENTE_ENVIO`
- `ERROR_EN_ENVÍO`

Solo lectura total:

- `ENVIANDO_O_EN_COLA`
- `PENDIENTE_VISADO`
- `VISADO`
- `VISADO_SIN_FICHERO_FIRMADO`
- `ANULADO`
- `CAJA`

## 20.3 Cuándo permitir borrar

Trabajo:

- no si hay algún documento enviado
- no si hay referencia de pago asignada

Documento:

- no si hay `FicherosColegiados` enviados
- no si hay referencia de pago asignada

Entidad:

- no si está usada en documentos

## 21. Qué debe reproducir la futura versión web

No basta con mover pantallas.

La web debe respetar, como mínimo:

- el documento maestro del trabajo
  - CE para visado
  - SR para registro
- la clonación de contexto al crear documentos
- el bloqueo del trabajo cuando el documento maestro ya no es editable
- la invalidez de firmas cuando cambian intervinientes
- los estados de documento y fichero como dos máquinas separadas pero coordinadas
- el paso intermedio “firmado pendiente de confirmación de envío”
- la cola de envíos y recepciones
- la dependencia del envío respecto a la CE/SR
- las restricciones por grupo de trabajo y municipio para GUMA y CFO
- la lógica de pagos de registro
- la obtención de NTL y NRL antes de firmar o al firmar

## 22. Recomendación de modelado para la migración

Si se reimplementa en web, conviene pensar el sistema en estos bounded contexts funcionales:

- `Trabajo`
  - datos básicos
  - grupo
  - localización
  - tipo de actuación
- `DocumentoMaestro`
  - CE o SR
  - intervinientes
  - promotores
  - colaboradores
  - reglas de reparto
- `DocumentoDerivado`
  - tipo documental
  - estructura y adjuntos
  - importes
  - flags de urgencia o pago
- `Firma`
  - firmantes
  - estado por versión de fichero
- `Envio`
  - confirmación
  - FTP
  - verificación hash
- `Recepcion`
  - solicitud
  - disponibilidad
  - descarga

## 23. Limitaciones de esta documentación

Este documento está construido por lectura de código, no por ejecución contra una BD real ni por trazas en producción.

Eso significa:

- la lógica funcional principal está capturada
- los nombres y estados observados son fiables
- algunos valores numéricos de clases de tipo documental no están resueltos desde el legacy, pero sus nombres funcionales sí
- pueden existir reglas menores escondidas en procedimientos SQL, WCF o librerías externas no visibles aquí

## 24. Archivos legacy clave analizados

Los archivos más relevantes para esta documentación han sido:

- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\dxwInicio.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\Comun.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\EnlacePKI.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\Envios.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\Recepcion.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucTrabajos.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucTrabajo.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucComEncargo.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucSolRegistro.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucDocumento.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucDocumentoDesglosado.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucDocumentoCFO.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucEntidad.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\ucColegiado.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\dxwSeleccionarTipoDocumento.xaml.vb`
- `C:\tecnosis.tfs\Clientes\COAS\ClienteCOAS\dxwSeleccionarOtrasFases.xaml.vb`

Y del modelo actual:

- `C:\tecnosis.git\Clientes\COAS\bdCOAS\Estados.cs`
- `C:\tecnosis.git\Clientes\COAS\bdCOAS\extensiones\Documentos.cs`
- `C:\tecnosis.git\Clientes\COAS\bdCOAS\extensiones\Trabajos.cs`
- `C:\tecnosis.git\Clientes\COAS\bdCOAS\db\TiposDocumentos.cs`

## 25. Resumen ejecutivo

Si otra IA solo se queda con cinco ideas, deberían ser estas:

1. El trabajo deja de ser editable cuando su CE o SR deja de estar en estado corregible.
2. CE y SR son documentos maestros; el resto de documentos heredan y dependen de ellos.
3. El ciclo real es: preparar -> firmar parcial o totalmente -> confirmar envío -> enviar -> tramitar en COAS -> recibir resultado o volver por nota/error.
4. Cambiar intervinientes en CE o SR puede invalidar documentos pendientes y resetear sus firmas.
5. La migración web debe modelar estados y versiones de fichero, no solo formularios.

