import api from "@/library/api"
import { settingsType } from "@/library/settingsType"

export async function fetchSettings(token = ''): Promise<{ data: settingsType }> {
  const response = await api.get("/settings", '', token)
  return response
}
