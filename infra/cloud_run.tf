locals {
  frontend_image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/frontend:${var.frontend_image_tag}"
}

resource "google_cloud_run_v2_service" "frontend" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.frontend_sa.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = local.frontend_image

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "NITRO_PORT"
        value = "3000"
      }

      env {
        name  = "NITRO_HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "NUXT_API_BASE_URL"
        value = var.backend_api_url
      }
    }
  }

  depends_on = [
    google_project_service.run_api,
    google_artifact_registry_repository.repo,
    google_service_account.frontend_sa,
  ]
}

# Allow unauthenticated public invocations (Web frontend)
resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.frontend.location
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
