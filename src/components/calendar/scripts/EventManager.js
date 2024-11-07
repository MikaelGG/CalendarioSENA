export default class EventManager {
  constructor() {
    this.apiUrl = "http://localhost:4000/api/event";
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
      console.log("Sending event:", formData);
      const response = await fetch(this.apiUrl, {
        method: "POST",
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
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
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
      await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("Error deleting event:", error);
      throw error;
    }
  }
}
