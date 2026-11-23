# Infraestructura como Código (Terraform) - Frontend Cloud Run

Este directorio contiene la definición modular y reproducible en **Terraform** para aprovisionar y desplegar la aplicación web Nuxt 3 (`tickets-frontend`) en **Google Cloud Run** y **Artifact Registry**.

---

## Arquitectura

- **Google Cloud Run (v2)**: Servicio contenedor serverless para Nuxt 3 (SSR con motor Nitro en Node.js) con auto-escalabilidad (0 a N instancias).
- **Google Artifact Registry**: Registro Docker privado para alojar las imágenes de producción del frontend.
- **Proxy Server-Side (Nitro)**: Las peticiones hacia la API se redirigen desde el servidor Nuxt (`/api/core/*`) hacia el servicio Cloud Run del backend (`/api/v1/*`) configurado mediante `NUXT_API_BASE_URL`.
- **Acceso Público**: Configuración declarativa de IAM (`roles/run.invoker` para `allUsers`).

---

## Prerrequisitos

1. **Google Cloud SDK (`gcloud`)**: Autenticado con permisos en el proyecto de GCP.
   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project TU_PROJECT_ID
   ```
2. **Terraform**: `>= 1.5.0` instalado.
3. **Docker / Cloud Build**: Para compilar y subir la imagen de contenedor.

---

## Paso a Paso para el Despliegue

### 1. Construir y Subir la Imagen Docker
Antes de aplicar Terraform, compila la imagen de producción optimizada para Nuxt mediante Cloud Build:

```bash
# Desde la raíz del repositorio tickets-datak-frontend
gcloud builds submit . \
  --tag us-central1-docker.pkg.dev/TU_PROJECT_ID/tickets-datak-repo/frontend:latest
```

### 2. Configurar Variables de Terraform
Copia el archivo de ejemplo `terraform.tfvars.example` a `terraform.tfvars`:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Edita `terraform.tfvars` con tus configuraciones:
```hcl
project_id      = "mi-proyecto-gcp"
region          = "us-central1"
service_name    = "tickets-frontend"
backend_api_url = "https://tickets-backend-XXXXX-uc.a.run.app"
```

### 3. Inicializar y Aplicar Terraform

```bash
# Inicializar los proveedores de Terraform
terraform init

# Validar la sintaxis y plan de ejecución
terraform plan

# Aplicar los cambios
terraform apply
```

Al finalizar, Terraform mostrará la URL pública asignada por Cloud Run:
```bash
Outputs:
frontend_url = "https://tickets-frontend-XXXXX-uc.a.run.app"
```

---

## Verificación

Abre la URL devuelta por Cloud Run en tu navegador o ejecuta:
```bash
curl -I https://tickets-frontend-XXXXX-uc.a.run.app
```
El servidor responderá con `HTTP/2 200 OK` y el HTML prerenderizado por Nuxt Nitro.
