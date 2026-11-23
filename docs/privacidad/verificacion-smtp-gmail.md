# Verificación de la cuenta SMTP de Google

**Fecha de comprobación** · 6 de noviembre de 2026  
**Servicio** · Correo saliente de Pro Fitness Glass  
**Resultado** · Gmail de consumo confirmado para la cuenta SMTP de producción. Google no ofrece un acuerdo de encargado del tratamiento para esta modalidad.

## Cuenta comprobada

En el panel de Zeabur, la variable `EMAIL_USER` del servicio `pro-fitness-glass-backend`, asociado al dominio público de la API, contiene `profitnessglass@gmail.com`. Coincide con la configuración local y con el contacto que publica la aplicación. Nodemailer usa Gmail como transporte. La comprobación fue de solo lectura y se limitó a la identidad de la cuenta. [Configuración SMTP](../../backend/services/emailService.js#L12) · [Política de privacidad](../../frontend/src/pages/PrivacyPolicy.jsx#L163)

Gmail recibe la dirección del destinatario, el asunto, el contenido y los datos técnicos de envío. La revisión de Zeabur confirma qué buzón se autentica para enviar. El titular confirmó que `profitnessglass@gmail.com` es una cuenta de Gmail personal sin suscripción de Workspace.

## Acuerdo de tratamiento

| Modalidad | Condiciones y evidencia para esta cuenta |
| --- | --- |
| Gmail de consumo (modalidad confirmada) | Se aplican los términos generales y la política de privacidad de Google. Google indica que no ofrece un acuerdo de tratamiento para Gmail de consumo y que, en esa modalidad, no actúa como encargado. [Centro de privacidad de Google](https://support.google.com/policies/answer/9581826?hl=en) |
| Google Workspace Individual | Los términos de esta suscripción incluyen Gmail entre los productos del plan e incorporan el DPA para su uso profesional o comercial en las condiciones descritas por Google. La dirección `@gmail.com` por sí sola no acredita que el plan esté activo ni que el envío revisado esté cubierto. La evidencia pertinente es la suscripción de esa misma cuenta y los términos aplicables al servicio usado. [Términos de Workspace Individual, apartados 2 a 4](https://workspace.google.com/terms/google-workspace-individual-terms/) · [DPA](https://business.safety.google/processorterms/) |
| Google Workspace de organización | Google publica un CDPA para el servicio de organización. Puede estar incorporado al contrato o requerir aceptación en Google Admin. Su aplicación se acredita para la organización y la cuenta emisora que estén cubiertas. [Ayuda de Google Admin sobre el CDPA](https://knowledge.workspace.google.com/admin/compliance/privacy-compliance-and-records-for-google-workspace-and-cloud-identity) |

El artículo 28 exige un contrato u otro acto jurídico vinculante cuando un proveedor trata datos por cuenta del responsable. La modalidad confirmada carece de la cobertura contractual necesaria para utilizar a Google como encargado del envío de correos de Pro Fitness Glass. [RGPD, art. 28](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807)

## Transferencias internacionales

- **Estados Unidos.** El registro oficial muestra que Google LLC participa activamente en el EU–U.S. Data Privacy Framework para datos no laborales. La decisión de adecuación permite usar este mecanismo para las transferencias al destinatario estadounidense certificado cuando la entidad y el tratamiento estén dentro del alcance de la certificación. [Registro de Google LLC](https://www.dataprivacyframework.gov/participant/5780) · [Decisiones de adecuación de la Comisión Europea](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en)
- **Otras transferencias.** Google publica su uso de cláusulas contractuales tipo cuando corresponde. El DPA al que remite Workspace Individual y el CDPA de Workspace contemplan mecanismos de transferencia y cláusulas aplicables según la ruta. Para atribuirlos a este envío hay que identificar el acuerdo que rige la cuenta, la entidad receptora y las transferencias o subencargados cubiertos. [Marcos de transferencia de Google](https://policies.google.com/privacy/frameworks?hl=es) · [DPA de Google, apéndice 3A, apartado 7](https://business.safety.google/processorterms/) · [RGPD, arts. 44 a 46](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807)

La decisión de adecuación y el acuerdo de encargo responden a requisitos distintos. La certificación de Google LLC permite valorar una ruta de transferencia, pero no acredita el acuerdo de tratamiento de la cuenta concreta.

## Cierre de la revisión

La identidad y la modalidad del servicio actual quedan documentadas. Para cerrar la cobertura del envío por cuenta de Pro Fitness Glass queda configurar un servicio SMTP con un acuerdo de encargo aplicable al producto y a la cuenta emisora, guardar el acuerdo y registrar las garantías de las transferencias relevantes para ese servicio.

## DonDominio como servicio previsto para profitnessglass.es

Soluciones Corporativas IP, S.L. (DonDominio) incluye los planes **Mail, Mail Plus y Mail Pro** en el apartado 4.1 de sus condiciones de alojamiento compartido. El apartado 16.2 incorpora el acuerdo de encargado del tratamiento del anexo I. Cuando se active el buzón, conviene conservar las condiciones aplicables al plan contratado y la constancia de contratación. El dominio por sí solo no incluye el buzón. [Condiciones de alojamiento y anexo I](https://www.dondominio.com/es/legal/7/condiciones-particulares-del-servicio-de-alojamiento-compartido/) · [Requisitos para disponer de correo](https://www.dondominio.com/es/help/23/puedo-utilizar-cuentas-correo-si-solo-tengo-contratado-dominio/)

El anexo I declara que los servidores, sistemas e instalaciones del servicio están en la UE, en las Islas Baleares. Para ese tramo del tratamiento no hace falta invocar el marco UE–EE. UU. La declaración se refiere al servicio de DonDominio. Deben evaluarse por separado los servicios auxiliares que impliquen transferencias y los demás proveedores del flujo. [Condiciones de alojamiento, anexo I, apartados 1 y 9](https://www.dondominio.com/es/legal/7/condiciones-particulares-del-servicio-de-alojamiento-compartido/) · [RGPD, arts. 44 a 46](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807)

El titular confirmó que creó `notificaciones@profitnessglass.es`, `soporte@profitnessglass.es` y `privacidad@profitnessglass.es`. El 6 de noviembre de 2026, los resolutores públicos de Google y Cloudflare devolvieron `NXDOMAIN` al consultar los registros MX de `profitnessglass.es`. Queda confirmar que el dominio publica los registros de correo y que los buzones reciben mensajes antes de activarlos en producción.

1. Configurar `EMAIL_HOST=smtp.dondominio.com`, `EMAIL_PORT=587` y `EMAIL_USER=notificaciones@profitnessglass.es` en el entorno del backend. Guardar la contraseña de ese buzón como `EMAIL_PASS` en el gestor de secretos del despliegue. El backend exige STARTTLS en ese puerto. Al usar esa cuenta con DonDominio, las respuestas se dirigen a `soporte@profitnessglass.es` y los correos promocionales indican `privacidad@profitnessglass.es` como contacto de privacidad. [Configuración SMTP oficial](https://www.dondominio.com/es/help/88/como-configuro-las-cuentas-correo-en-microsoft-outlook/)
2. Publicar el frontend con `VITE_MAIL_PROVIDER=dondominio` después de activar ese SMTP. La política mostrará DonDominio como proveedor y `privacidad@profitnessglass.es` para el ejercicio de derechos. Soporte, Términos y Aviso Legal mostrarán `soporte@profitnessglass.es`.
3. Probar la recepción y la baja con el buzón propio desde **Panel Admin → Correos → Prueba de baja de correo**. Revisar que el mensaje recibido identifique a `notificaciones@profitnessglass.es` como remitente y a `soporte@profitnessglass.es` como dirección de respuesta.
