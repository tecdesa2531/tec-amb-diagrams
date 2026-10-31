---
name: iconos-aws
description: >-
  Como leer el paquete oficial AWS Architecture Icons dentro de iconos/ y
  construir el catalogo de la paleta: categorias, nombres, variantes, busqueda
  y alias. Usar al crear o modificar el catalogo de iconos, al actualizar el
  paquete a una version nueva, o al implementar la busqueda y seleccion de
  iconos en la paleta. Dispara aunque el usuario no mencione "iconos" si toca
  el catalogo, la paleta lateral o el directorio iconos/.
---

# Catalogo de iconos AWS

## Primero inspeccionar, despues programar

La estructura del paquete AWS Architecture Icons **cambia entre versiones**.
Antes de escribir o modificar el catalogo:

1. Listar los primeros niveles de `iconos/` y mostrarle al usuario la estructura
   real que encontraste.
2. Identificar carpetas de servicios (`Architecture-Service-Icons...`),
   recursos (`Resource-Icons...`), grupos (`Architecture-Group-Icons...`) y
   categorias (`Category-Icons...`).
3. Identificar variantes de tamano y tema (por ejemplo 16/32/48/64, y Light/Dark).
4. Proponer las reglas de extraccion y **esperar confirmacion** antes de programar.

## Reglas del catalogo

- Leer solo archivos `.svg`. Ignorar PNG, PPTX, archivos ocultos y `__MACOSX`.
- **Una sola variante por icono:**
  - servicios: preferir 64; si no existe, 48.
  - recursos: preferir 48 Light.
  - grupos: preferir 32.
- **id estable** en minusculas, p.ej. `arch-amazon-ec2`. Debe ser igual en Mac
  y Windows, e igual al reabrir: el `.ambito` lo referencia.
- **Nombre legible:** quitar prefijos (`Arch_`, `Res_`, `Arch-Category_`), sufijos
  de tamano/tema (`_64`, `_48_Light`) y reemplazar guiones por espacios.
  Ejemplo: `Arch_Amazon-EC2_64.svg` → `"Amazon EC2"`.
- **Categoria:** nombre de la carpeta sin prefijo. Ejemplo: `Arch_Compute` → `"Compute"`.
- Recorrer carpetas con `pathlib` y ordenar resultados **alfabeticamente** (mismo
  orden en todos los sistemas).
- Leer archivos con `encoding="utf-8"`.

## Busqueda

Sin distinguir mayusculas ni tildes, sobre nombre y categoria.

**Alias minimos** (tabla en el codigo, facil de ampliar):

| Alias | Nombre oficial |
|---|---|
| ec2 | Amazon EC2 |
| s3 | Amazon S3 |
| rds | Amazon RDS |
| alb, elb | Elastic Load Balancing |
| nlb | Network Load Balancer |
| nat | NAT Gateway |
| igw | Internet Gateway |
| vpc | Amazon VPC |
| eks | Amazon EKS |
| ecs | Amazon ECS |
| lambda | AWS Lambda |
| cloudfront | Amazon CloudFront |
| route53 | Amazon Route 53 |
| waf | AWS WAF |
| iam | AWS IAM |
| kms | AWS KMS |
| sqs | Amazon SQS |
| sns | Amazon SNS |
| dynamodb | Amazon DynamoDB |
| apigw | Amazon API Gateway |
| tgw | AWS Transit Gateway |
| vpn | AWS VPN |
| dx | AWS Direct Connect |
| cloudwatch | Amazon CloudWatch |

## No hacer

- No modificar, recolorear ni optimizar los SVG oficiales.
- No versionar `iconos/` en git (ya esta en `.gitignore`).
- No depender de `iconos/` para abrir un `.ambito`: el archivo trae embebidos
  los SVG que usa.
