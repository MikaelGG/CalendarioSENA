export default class EventManager {
  constructor() {
    this.apiUrl = "http://localhost:4000/api/event";
  }

  // Función auxiliar para obtener el token del localStorage
  getAuthHeader() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getEvents() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.log("Error fetching event:", error);
      throw error;
    }
  }

  async saveEvent(formData) {
    try {
      const headers = this.getAuthHeader();

      console.log("Sending event:", formData);
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          ...headers,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating event");
      }
      return await response.json();
    } catch (error) {
      console.log("Error saving event:", error);
      throw error;
    }
  }

  async updateEvent(formData, id) {
    try {
      const headers = this.getAuthHeader();

      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
        headers: {
          ...headers,
        },
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.log("Error updating event:", error);
      throw error;
    }
  }

  async deleteEvent(id) {
    try {
      const headers = this.getAuthHeader();

      await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });
    } catch (error) {
      console.log("Error deleting event:", error);
      throw error;
    }
  }
}
