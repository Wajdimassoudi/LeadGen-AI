export interface CompanyLead {
  email: string;
  company_name: string;
}

export async function generateLeads(query: string): Promise<CompanyLead[]> {
  try {
    const response = await fetch("/api/generate-leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch leads");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating leads:", error);
    throw error;
  }
}
