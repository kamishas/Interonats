import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize sample organizations for Product Admin demo
async function initializeSampleData() {
  try {
    const existingOrgs = await kv.getByPrefix("organization:");
    
    // Only create sample data if no organizations exist
    if (!existingOrgs || existingOrgs.length === 0) {
      console.log("Initializing sample organizations for Product Admin dashboard...");
      
      const sampleOrganizations = [
        {
          id: crypto.randomUUID(),
          name: "Acme Corporation",
          subscriptionPlan: "enterprise",
          status: "active",
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: "TechStart Inc",
          subscriptionPlan: "professional",
          status: "active",
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: "Global Consulting LLC",
          subscriptionPlan: "professional",
          status: "active",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: "SmallBiz Solutions",
          subscriptionPlan: "starter",
          status: "active",
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: "Startup Ventures",
          subscriptionPlan: "starter",
          status: "trial",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: "FreeTier Company",
          subscriptionPlan: "free",
          status: "active",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const org of sampleOrganizations) {
        await kv.set(`organization:${org.id}`, org);
      }
      
      console.log(`✅ Created ${sampleOrganizations.length} sample organizations`);
      
      // Create sample users for Product Admin testing
      const existingUsers = await kv.getByPrefix("user:");
      if (!existingUsers || existingUsers.length === 0) {
        console.log("Initializing sample users for User Management...");
        
        const sampleUsers = [
          {
            id: crypto.randomUUID(),
            email: "admin@acmecorp.com",
            name: "John Smith",
            role: "admin",
            organizationId: sampleOrganizations[0].id,
            status: "active",
            createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "hr@acmecorp.com",
            name: "Sarah Johnson",
            role: "hr",
            organizationId: sampleOrganizations[0].id,
            status: "active",
            createdAt: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "recruiter@techstart.com",
            name: "Mike Davis",
            role: "recruiter",
            organizationId: sampleOrganizations[1].id,
            status: "active",
            createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "accounting@globalconsulting.com",
            name: "Emily Chen",
            role: "accounting-manager",
            organizationId: sampleOrganizations[2].id,
            status: "active",
            createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date().toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "immigration@acmecorp.com",
            name: "Robert Martinez",
            role: "immigration-team",
            organizationId: sampleOrganizations[0].id,
            status: "active",
            createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "licensing@techstart.com",
            name: "Jessica Brown",
            role: "licensing-team",
            organizationId: sampleOrganizations[1].id,
            status: "active",
            createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "employee1@acmecorp.com",
            name: "David Wilson",
            role: "employee",
            organizationId: sampleOrganizations[0].id,
            status: "active",
            createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "suspended@smallbiz.com",
            name: "James Anderson",
            role: "employee",
            organizationId: sampleOrganizations[3].id,
            status: "suspended",
            createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "pending@startup.com",
            name: "Maria Garcia",
            role: "employee",
            organizationId: sampleOrganizations[4].id,
            status: "pending",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: crypto.randomUUID(),
            email: "employee2@globalconsulting.com",
            name: "Thomas Lee",
            role: "employee",
            organizationId: sampleOrganizations[2].id,
            status: "active",
            createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        
        for (const user of sampleUsers) {
          await kv.set(`user:${user.id}`, user);
        }
        
        console.log(`✅ Created ${sampleUsers.length} sample users`);
      }
    }
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
}

// Initialize sample data on startup
initializeSampleData();

// Health check endpoint
app.get("/make-server-f8517b5b/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// IMMIGRATION MANAGEMENT ENDPOINTS
// ============================================

// Get all immigration records (auto-synced from employees)
app.get("/make-server-f8517b5b/immigration/records", async (c) => {
  try {
    // Get all employees and filter out incomplete ones
    let employees = await kv.getByPrefix("employee:");
    employees = (employees || []).filter((emp: any) => 
      emp.firstName && 
      emp.lastName && 
      emp.email
    );
    
    const immigrationRecords = await kv.getByPrefix("immigration:record:");
    
    // Create a map of existing immigration records by employeeId
    const immigrationMap = new Map();
    (immigrationRecords || []).forEach((record: any) => {
      if (record.employeeId) {
        immigrationMap.set(record.employeeId, record);
      }
    });
    
    // Sync or create immigration records for all valid employees
    const now = new Date().toISOString();
    const syncedRecords = [];
    
    for (const employee of employees) {
      let record = immigrationMap.get(employee.id);
      
      if (!record) {
        // Create new immigration record for employee without one
        record = {
          id: crypto.randomUUID(),
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          currentStatus: employee.immigrationStatus || "Unknown",
          visaType: employee.visaType || undefined,
          workAuthorizationExpiry: employee.visaExpiry || undefined,
          requiresSponsorship: false,
          hasActiveGCProcess: false,
          cases: [],
          filings: [],
          documents: [],
          dependents: [],
          costs: [],
          auditHistory: [{
            date: now,
            action: "Immigration record auto-synced from employee data",
            performedBy: "System"
          }],
          createdAt: now,
          updatedAt: now
        };
        
        await kv.set(`immigration:record:${record.id}`, record);
      } else {
        // Update employee name/email if changed
        const needsUpdate = 
          record.employeeName !== `${employee.firstName} ${employee.lastName}` ||
          record.email !== employee.email;
          
        if (needsUpdate) {
          record.employeeName = `${employee.firstName} ${employee.lastName}`;
          record.email = employee.email;
          record.updatedAt = now;
          await kv.set(`immigration:record:${record.id}`, record);
        }
        
        // Initialize dependents array if it doesn't exist (for legacy records)
        if (!record.dependents) {
          record.dependents = [];
          record.updatedAt = now;
          await kv.set(`immigration:record:${record.id}`, record);
        }
      }
      
      syncedRecords.push(record);
    }
    
    return c.json({ records: syncedRecords });
  } catch (error) {
    console.error("Error fetching immigration records:", error);
    return c.json({ error: "Failed to fetch immigration records", details: String(error) }, 500);
  }
});

// Get single immigration record
app.get("/make-server-f8517b5b/immigration/records/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const record = await kv.get(`immigration:record:${id}`);
    
    if (!record) {
      return c.json({ error: "Immigration record not found" }, 404);
    }
    
    return c.json({ record });
  } catch (error) {
    console.error("Error fetching immigration record:", error);
    return c.json({ error: "Failed to fetch immigration record", details: String(error) }, 500);
  }
});

// Create new employee immigration record
app.post("/make-server-f8517b5b/immigration/employees", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.employeeName || !body.currentStatus) {
      return c.text("Missing required fields: employeeName, currentStatus", 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newRecord = {
      id,
      employeeId: id,
      employeeName: body.employeeName,
      email: body.email || "",
      
      // Current Status
      currentStatus: body.currentStatus,
      petitionNumber: body.petitionNumber || undefined,
      workAuthorizationExpiry: body.workAuthorizationExpiry || undefined,
      
      // I-94 Information
      i94Number: body.i94Number || undefined,
      i94Expiry: body.i94Expiry || undefined,
      i94AdmissionDate: body.i94AdmissionDate || undefined,
      
      // Passport Information
      passportNumber: body.passportNumber || undefined,
      passportCountry: body.passportCountry || undefined,
      passportIssueDate: body.passportIssueDate || undefined,
      passportExpiryDate: body.passportExpiryDate || undefined,
      
      // Visa Information
      visaType: body.visaType || undefined,
      visaNumber: body.visaNumber || undefined,
      visaIssueDate: body.visaIssueDate || undefined,
      visaExpiryDate: body.visaExpiryDate || undefined,
      
      // EAD Information
      eadNumber: body.eadNumber || undefined,
      eadCategory: body.eadCategory || undefined,
      eadIssueDate: body.eadIssueDate || undefined,
      eadExpiryDate: body.eadExpiryDate || undefined,
      
      // Sponsorship
      requiresSponsorship: body.requiresSponsorship || false,
      currentSponsor: body.currentSponsor || undefined,
      
      // Attorney Information
      primaryAttorneyId: body.primaryAttorneyId || undefined,
      lawFirm: body.lawFirm || undefined,
      
      // Related Data
      hasActiveGCProcess: false,
      cases: [],
      filings: [],
      documents: [],
      dependents: [],
      costs: [],
      auditHistory: [{
        id: crypto.randomUUID(),
        entityType: 'employee',
        entityId: id,
        action: 'created',
        performedBy: 'System',
        performedAt: now,
        notes: 'Immigration record created'
      }],
      
      // Alerts
      alerts: [],
      alertSettings: {
        days120: true,
        days90: true,
        days60: true,
        days30: true
      },
      
      notes: body.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`immigration:record:${id}`, newRecord);

    return c.json({ record: newRecord }, 201);
  } catch (error) {
    console.error("Error creating employee immigration record:", error);
    return c.text(`Failed to create employee immigration record: ${error}`, 500);
  }
});

// Update employee immigration record
app.put("/make-server-f8517b5b/immigration/employees/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const record = await kv.get(`immigration:record:${id}`);
    if (!record) {
      return c.text("Immigration record not found", 404);
    }

    const now = new Date().toISOString();

    const updatedRecord = {
      ...record,
      employeeName: body.employeeName ?? record.employeeName,
      email: body.email ?? record.email,
      currentStatus: body.currentStatus ?? record.currentStatus,
      petitionNumber: body.petitionNumber ?? record.petitionNumber,
      workAuthorizationExpiry: body.workAuthorizationExpiry ?? record.workAuthorizationExpiry,
      i94Number: body.i94Number ?? record.i94Number,
      i94Expiry: body.i94Expiry ?? record.i94Expiry,
      i94AdmissionDate: body.i94AdmissionDate ?? record.i94AdmissionDate,
      passportNumber: body.passportNumber ?? record.passportNumber,
      passportCountry: body.passportCountry ?? record.passportCountry,
      passportIssueDate: body.passportIssueDate ?? record.passportIssueDate,
      passportExpiryDate: body.passportExpiryDate ?? record.passportExpiryDate,
      visaType: body.visaType ?? record.visaType,
      visaNumber: body.visaNumber ?? record.visaNumber,
      visaIssueDate: body.visaIssueDate ?? record.visaIssueDate,
      visaExpiryDate: body.visaExpiryDate ?? record.visaExpiryDate,
      eadNumber: body.eadNumber ?? record.eadNumber,
      eadCategory: body.eadCategory ?? record.eadCategory,
      eadIssueDate: body.eadIssueDate ?? record.eadIssueDate,
      eadExpiryDate: body.eadExpiryDate ?? record.eadExpiryDate,
      requiresSponsorship: body.requiresSponsorship ?? record.requiresSponsorship,
      currentSponsor: body.currentSponsor ?? record.currentSponsor,
      lawFirm: body.lawFirm ?? record.lawFirm,
      notes: body.notes ?? record.notes,
      updatedAt: now,
    };

    updatedRecord.auditHistory = updatedRecord.auditHistory || [];
    updatedRecord.auditHistory.push({
      id: crypto.randomUUID(),
      entityType: 'employee',
      entityId: id,
      action: 'updated',
      performedBy: 'User',
      performedAt: now,
      notes: 'Immigration record updated'
    });

    await kv.set(`immigration:record:${id}`, updatedRecord);

    return c.json({ record: updatedRecord });
  } catch (error) {
    console.error("Error updating employee immigration record:", error);
    return c.text(`Failed to update employee immigration record: ${error}`, 500);
  }
});

// Delete employee immigration record
app.delete("/make-server-f8517b5b/immigration/records/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const record = await kv.get(`immigration:record:${id}`);
    if (!record) {
      return c.text("Immigration record not found", 404);
    }

    // Delete the main record
    await kv.del(`immigration:record:${id}`);

    return c.json({ success: true, message: "Immigration record deleted successfully" });
  } catch (error) {
    console.error("Error deleting immigration record:", error);
    return c.text(`Failed to delete immigration record: ${error}`, 500);
  }
});

// Add filing to employee record
app.post("/make-server-f8517b5b/immigration/filings", async (c) => {
  try {
    const body = await c.req.json();
    const {
      employeeId,
      dependentId,
      dependentName,
      filingType,
      immigrationStatus,
      receiptNumber,
      filedDate,
      approvalDate,
      expiryDate,
      status,
      notes,
      costAmount,
      costAllocatedTo,
    } = body;

    if (!employeeId || !filingType) {
      return c.json({ error: "Missing required fields: employeeId, filingType" }, 400);
    }

    const record = await kv.get(`immigration:record:${employeeId}`);
    if (!record) {
      return c.json({ error: "Immigration record not found" }, 404);
    }

    // If dependentId is provided, verify it exists
    if (dependentId) {
      const dependentExists = record.dependents?.some((d: any) => d.id === dependentId);
      if (!dependentExists) {
        return c.json({ error: "Dependent not found" }, 404);
      }
    }

    const filingId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newFiling = {
      id: filingId,
      employeeId,
      dependentId: dependentId || undefined,
      dependentName: dependentName || undefined,
      filingType,
      immigrationStatus,
      receiptNumber: receiptNumber || undefined,
      filedDate: filedDate || undefined,
      approvalDate: approvalDate || undefined,
      expiryDate: expiryDate || undefined,
      status: status || "Not Started",
      notes: notes || "",
      costAmount: costAmount || undefined,
      costAllocatedTo: costAllocatedTo || undefined,
      createdAt: now,
      updatedAt: now,
    };

    record.filings.push(newFiling);
    record.updatedAt = now;

    await kv.set(`immigration:record:${employeeId}`, record);

    return c.json({ filing: newFiling }, 201);
  } catch (error) {
    console.error("Error adding filing:", error);
    return c.json({ error: "Failed to add filing", details: String(error) }, 500);
  }
});

// Update filing
app.put("/make-server-f8517b5b/immigration/filings/:filingId", async (c) => {
  try {
    const filingId = c.req.param("filingId");
    const body = await c.req.json();
    const {
      dependentId,
      dependentName,
      filingType,
      immigrationStatus,
      receiptNumber,
      filedDate,
      approvalDate,
      expiryDate,
      status,
      notes,
      costAmount,
      costAllocatedTo,
    } = body;

    if (!filingType) {
      return c.json({ error: "Missing required field: filingType" }, 400);
    }

    // Find the record containing this filing
    const allRecords = await kv.getByPrefix("immigration:record:");
    let targetRecord = null;
    let filingIndex = -1;

    for (const record of allRecords) {
      const index = record.filings.findIndex((f: any) => f.id === filingId);
      if (index !== -1) {
        targetRecord = record;
        filingIndex = index;
        break;
      }
    }

    if (!targetRecord || filingIndex === -1) {
      return c.json({ error: "Filing not found" }, 404);
    }

    const now = new Date().toISOString();

    // Update the filing
    targetRecord.filings[filingIndex] = {
      ...targetRecord.filings[filingIndex],
      dependentId: dependentId !== undefined ? dependentId : targetRecord.filings[filingIndex].dependentId,
      dependentName: dependentName !== undefined ? dependentName : targetRecord.filings[filingIndex].dependentName,
      filingType,
      immigrationStatus,
      receiptNumber: receiptNumber || undefined,
      filedDate: filedDate || undefined,
      approvalDate: approvalDate || undefined,
      expiryDate: expiryDate || undefined,
      status: status || "Not Started",
      notes: notes || "",
      costAmount: costAmount || undefined,
      costAllocatedTo: costAllocatedTo || undefined,
      updatedAt: now,
    };

    targetRecord.updatedAt = now;

    await kv.set(`immigration:record:${targetRecord.employeeId}`, targetRecord);

    console.log(`[Immigration] Filing ${filingId} updated successfully`);
    return c.json({ filing: targetRecord.filings[filingIndex] }, 200);
  } catch (error) {
    console.error("Error updating filing:", error);
    return c.json({ error: "Failed to update filing", details: String(error) }, 500);
  }
});

// Add case to employee record
app.post("/make-server-f8517b5b/immigration/cases", async (c) => {
  try {
    const body = await c.req.json();
    const {
      employeeId,
      caseType,
      caseNumber,
      status,
      filingDate,
      responseDate,
      notes,
    } = body;

    if (!employeeId || !caseType) {
      return c.json({ error: "Missing required fields: employeeId, caseType" }, 400);
    }

    const record = await kv.get(`immigration:record:${employeeId}`);
    if (!record) {
      return c.json({ error: "Immigration record not found" }, 404);
    }

    const caseId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newCase = {
      id: caseId,
      employeeId,
      caseType,
      caseNumber: caseNumber || undefined,
      status: status || "Open",
      filingDate: filingDate || undefined,
      responseDate: responseDate || undefined,
      notes: notes || "",
      createdAt: now,
      updatedAt: now,
    };

    record.cases.push(newCase);
    record.updatedAt = now;

    await kv.set(`immigration:record:${employeeId}`, record);

    return c.json({ case: newCase }, 201);
  } catch (error) {
    console.error("Error adding case:", error);
    return c.json({ error: "Failed to add case", details: String(error) }, 500);
  }
});

// Add dependent to employee record
app.post("/make-server-f8517b5b/immigration/dependents", async (c) => {
  try {
    const body = await c.req.json();
    const {
      employeeId,
      name,
      relationship,
      dateOfBirth,
      currentStatus,
      passportNumber,
      passportCountry,
      passportExpiry,
      visaType,
      visaExpiry,
      i94Number,
      i94Expiry,
      notes,
    } = body;

    if (!employeeId || !name || !relationship) {
      return c.json({ error: "Missing required fields: employeeId, name, relationship" }, 400);
    }

    const record = await kv.get(`immigration:record:${employeeId}`);
    if (!record) {
      return c.json({ error: "Immigration record not found" }, 404);
    }

    const dependentId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newDependent = {
      id: dependentId,
      employeeId,
      name,
      relationship,
      dateOfBirth: dateOfBirth || undefined,
      currentStatus: currentStatus || undefined,
      passportNumber: passportNumber || undefined,
      passportCountry: passportCountry || undefined,
      passportExpiry: passportExpiry || undefined,
      visaType: visaType || undefined,
      visaExpiry: visaExpiry || undefined,
      i94Number: i94Number || undefined,
      i94Expiry: i94Expiry || undefined,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Initialize dependents array if it doesn't exist
    if (!record.dependents) {
      record.dependents = [];
    }

    record.dependents.push(newDependent);
    record.updatedAt = now;

    await kv.set(`immigration:record:${employeeId}`, record);

    return c.json({ dependent: newDependent }, 201);
  } catch (error) {
    console.error("Error adding dependent:", error);
    return c.json({ error: "Failed to add dependent", details: String(error) }, 500);
  }
});

// Delete dependent from employee record
app.delete("/make-server-f8517b5b/immigration/dependents/:id", async (c) => {
  try {
    const dependentId = c.req.param("id");
    
    // Find the immigration record that contains this dependent
    const allRecords = await kv.getByPrefix("immigration:record:");
    let foundRecord = null;
    let employeeId = null;
    
    for (const record of allRecords) {
      if (record.dependents && record.dependents.some((d: any) => d.id === dependentId)) {
        foundRecord = record;
        employeeId = record.id;
        break;
      }
    }
    
    if (!foundRecord) {
      return c.json({ error: "Dependent not found" }, 404);
    }
    
    // Remove the dependent from the array
    foundRecord.dependents = foundRecord.dependents.filter((d: any) => d.id !== dependentId);
    foundRecord.updatedAt = new Date().toISOString();
    
    await kv.set(`immigration:record:${employeeId}`, foundRecord);
    
    return c.json({ success: true, message: "Dependent deleted successfully" });
  } catch (error) {
    console.error("Error deleting dependent:", error);
    return c.json({ error: "Failed to delete dependent", details: String(error) }, 500);
  }
});

// Add cost to employee record
app.post("/make-server-f8517b5b/immigration/costs", async (c) => {
  try {
    const body = await c.req.json();
    const {
      employeeId,
      description,
      amount,
      allocatedTo,
      paidDate,
      notes,
    } = body;

    if (!employeeId || !description || !amount) {
      return c.json({ error: "Missing required fields: employeeId, description, amount" }, 400);
    }

    const record = await kv.get(`immigration:record:${employeeId}`);
    if (!record) {
      return c.json({ error: "Immigration record not found" }, 404);
    }

    const costId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newCost = {
      id: costId,
      employeeId,
      description,
      amount,
      allocatedTo: allocatedTo || "Company",
      paidDate: paidDate || undefined,
      notes: notes || "",
      createdAt: now,
      updatedAt: now,
    };

    record.costs.push(newCost);
    record.updatedAt = now;

    await kv.set(`immigration:record:${employeeId}`, record);

    return c.json({ cost: newCost }, 201);
  } catch (error) {
    console.error("Error adding cost:", error);
    return c.json({ error: "Failed to add cost", details: String(error) }, 500);
  }
});

// Create Green Card process
app.post("/make-server-f8517b5b/immigration/green-card", async (c) => {
  try {
    const body = await c.req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return c.json({ error: "Missing required field: employeeId" }, 400);
    }

    const record = await kv.get(`immigration:record:${employeeId}`);
    if (!record) {
      return c.json({ error: "Employee record not found" }, 404);
    }

    if (record.hasActiveGCProcess) {
      return c.json({ error: "Employee already has an active Green Card process" }, 400);
    }

    const now = new Date().toISOString();

    const greenCardProcess = {
      id: crypto.randomUUID(),
      employeeId,
      currentStage: body.currentStage || "PERM",
      status: "In Progress",
      pwdSubmittedDate: body.pwdSubmittedDate || undefined,
      pwdApprovedDate: body.pwdApprovedDate || undefined,
      permFiledDate: body.permFiledDate || undefined,
      permApprovedDate: body.permApprovedDate || undefined,
      i140FiledDate: body.i140FiledDate || undefined,
      i140ApprovedDate: body.i140ApprovedDate || undefined,
      i485FiledDate: body.i485FiledDate || undefined,
      i485ApprovedDate: body.i485ApprovedDate || undefined,
      gcApprovedDate: body.gcApprovedDate || undefined,
      priorityDate: body.priorityDate || undefined,
      notes: body.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    record.greenCardProcess = greenCardProcess;
    record.hasActiveGCProcess = true;
    record.auditHistory.push({
      id: crypto.randomUUID(),
      entityType: 'greencard',
      entityId: employeeId,
      action: 'created',
      performedBy: 'User',
      performedAt: now,
      notes: 'Green Card process initiated'
    });
    record.updatedAt = now;

    await kv.set(`immigration:record:${employeeId}`, record);

    return c.json({ greenCardProcess }, 201);
  } catch (error) {
    console.error("Error creating Green Card process:", error);
    return c.json({ error: "Failed to create Green Card process", details: String(error) }, 500);
  }
});

// Update Green Card process
app.put("/make-server-f8517b5b/immigration/green-card/:employeeId", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const body = await c.req.json();

    const record = await kv.get(`immigration:record:${employeeId}`);
    if (!record) {
      return c.json({ error: "Employee record not found" }, 404);
    }

    if (!record.hasActiveGCProcess) {
      return c.json({ error: "No active Green Card process found" }, 404);
    }

    const now = new Date().toISOString();

    record.greenCardProcess = {
      ...record.greenCardProcess,
      currentStage: body.currentStage || record.greenCardProcess.currentStage,
      status: body.status || record.greenCardProcess.status,
      pwdSubmittedDate: body.pwdSubmittedDate || record.greenCardProcess.pwdSubmittedDate,
      pwdApprovedDate: body.pwdApprovedDate || record.greenCardProcess.pwdApprovedDate,
      permFiledDate: body.permFiledDate || record.greenCardProcess.permFiledDate,
      permApprovedDate: body.permApprovedDate || record.greenCardProcess.permApprovedDate,
      i140FiledDate: body.i140FiledDate || record.greenCardProcess.i140FiledDate,
      i140ApprovedDate: body.i140ApprovedDate || record.greenCardProcess.i140ApprovedDate,
      i485FiledDate: body.i485FiledDate || record.greenCardProcess.i485FiledDate,
      i485ApprovedDate: body.i485ApprovedDate || record.greenCardProcess.i485ApprovedDate,
      gcApprovedDate: body.gcApprovedDate || record.greenCardProcess.gcApprovedDate,
      priorityDate: body.priorityDate || record.greenCardProcess.priorityDate,
      notes: body.notes || record.greenCardProcess.notes,
      updatedAt: now
    };

    record.auditHistory.push({
      id: crypto.randomUUID(),
      entityType: 'greencard',
      entityId: employeeId,
      action: 'updated',
      performedBy: 'User',
      performedAt: now,
      notes: 'Green Card process updated'
    });
    record.updatedAt = now;

    await kv.set(`immigration:record:${employeeId}`, record);

    return c.json({ greenCardProcess: record.greenCardProcess });
  } catch (error) {
    console.error("Error updating Green Card process:", error);
    return c.text(`Failed to update Green Card process: ${error}`, 500);
  }
});

// Delete Green Card process
app.delete("/make-server-f8517b5b/immigration/green-card/:employeeId", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const record = await kv.get(`immigration:record:${employeeId}`);

    if (!record) {
      return c.text("Employee record not found", 404);
    }

    if (!record.hasActiveGCProcess) {
      return c.text("No active Green Card process found", 404);
    }

    // Remove the Green Card process
    record.greenCardProcess = undefined;
    record.hasActiveGCProcess = false;
    
    const now = new Date().toISOString();
    record.auditHistory.push({
      id: crypto.randomUUID(),
      entityType: 'greencard',
      entityId: employeeId,
      action: 'deleted',
      performedBy: 'System',
      performedAt: now,
      notes: 'Green Card process deleted'
    });
    record.updatedAt = now;

    await kv.set(`immigration:record:${employeeId}`, record);

    return c.json({ message: "Green Card process deleted successfully" });
  } catch (error) {
    console.error("Error deleting Green Card process:", error);
    return c.text(`Failed to delete Green Card process: ${error}`, 500);
  }
});

// ============================================
// EMPLOYEE ONBOARDING WORKFLOW ENDPOINTS
// ============================================

// Helper function to create initial workflow
function createInitialWorkflow(employeeId: string, homeState?: string, requiresImmigrationCase = false) {
  const now = new Date().toISOString();
  
  return {
    currentStage: 'initiation',
    tasks: [
      // Stage 1: Initiation (Recruiter handles client-facing tasks)
      { id: crypto.randomUUID(), stage: 'initiation', taskName: 'Confirm project rate with Recruiter', department: 'Recruiter', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'initiation', taskName: 'Send client confirmation email', department: 'Recruiter', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'initiation', taskName: 'Receive confirmation from client', department: 'Recruiter', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'initiation', taskName: 'Send Congratulations Email', department: 'Recruiter', status: 'pending', dependencies: [] },
      
      // Stage 2: Data Collection (HR handles document collection)
      { id: crypto.randomUUID(), stage: 'data-collection', taskName: 'Collect Home Address', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'data-collection', taskName: 'Collect Work Authorization proof', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'data-collection', taskName: 'Collect Government ID', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'data-collection', taskName: 'Issue Offer Letter', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'data-collection', taskName: 'Issue NDA for e-signature', department: 'HR', status: 'pending', dependencies: [] },
      
      // Stage 3: Verification & Legal Compliance
      { id: crypto.randomUUID(), stage: 'verification', taskName: 'Initiate I-9 / E-Verify', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'verification', taskName: 'Notify Immigration team if needed', department: 'Immigration', status: requiresImmigrationCase ? 'completed' : 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'verification', taskName: 'Create Immigration Case (Auto-triggered)', department: 'Immigration', status: requiresImmigrationCase ? 'completed' : 'not-applicable', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'verification', taskName: 'Obtain Immigration Approval for Work Authorization', department: 'Immigration', status: requiresImmigrationCase ? 'pending' : 'not-applicable', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'verification', taskName: 'Assign Employee Handbook', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'verification', taskName: 'Assign Policies', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'verification', taskName: 'Complete Client-Specific Requirements', department: 'HR', status: 'pending', dependencies: [] },
      
      // Stage 4: Payroll Setup
      { id: crypto.randomUUID(), stage: 'payroll-setup', taskName: 'Initiate ADP onboarding', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'payroll-setup', taskName: 'Validate pay rate', department: 'Accounting', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'payroll-setup', taskName: 'Validate pay schedule', department: 'Accounting', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'payroll-setup', taskName: 'Validate deductions', department: 'Accounting', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'payroll-setup', taskName: 'Validate state compliance', department: 'Accounting', status: 'pending', dependencies: [] },
      
      // Stage 5: Licensing (conditional on new state)
      { id: crypto.randomUUID(), stage: 'licensing', taskName: 'Create State Withholding Account', department: 'Licensing', status: homeState ? 'pending' : 'completed', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'licensing', taskName: 'Create Unemployment Insurance Account', department: 'Licensing', status: homeState ? 'pending' : 'completed', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'licensing', taskName: 'Create Workers\' Compensation policy', department: 'Licensing', status: homeState ? 'pending' : 'completed', dependencies: [] },
      
      // Stage 6: Classification
      { id: crypto.randomUUID(), stage: 'classification', taskName: 'Classify employee type', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'classification', taskName: 'Link to client and PO (if billable)', department: 'Accounting', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'classification', taskName: 'Verify classification setup', department: 'HR', status: 'pending', dependencies: [] },
      
      // Stage 7: Finalization
      { id: crypto.randomUUID(), stage: 'finalization', taskName: 'HR final sign-off', department: 'HR', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'finalization', taskName: 'Immigration final sign-off', department: 'Immigration', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'finalization', taskName: 'Licensing final sign-off', department: 'Licensing', status: 'pending', dependencies: [] },
      { id: crypto.randomUUID(), stage: 'finalization', taskName: 'Accounting final sign-off', department: 'Accounting', status: 'pending', dependencies: [] },
    ],
    departmentApprovals: [
      { department: 'HR', status: 'pending' },
      { department: 'Immigration', status: 'pending' },
      { department: 'Licensing', status: 'pending' },
      { department: 'Accounting', status: 'pending' },
      { department: 'Recruiter', status: 'pending' },
    ],
    initiatedDate: now,
    projectRateConfirmed: false,
    clientConfirmationSent: false,
    congratulationsEmailSent: false,
    homeAddressReceived: false,
    workAuthorizationReceived: false,
    governmentIdReceived: false,
    offerLetterIssued: false,
    ndaSigned: false,
    i9Initiated: false,
    eVerifyCompleted: false,
    immigrationNotificationSent: requiresImmigrationCase, // Auto-set if immigration case required
    immigrationCaseCreated: requiresImmigrationCase, // Auto-set if immigration case required
    immigrationCaseApproved: !requiresImmigrationCase, // If no case needed, auto-approve
    employeeHandbookAssigned: false,
    policiesAssigned: false,
    clientRequirementsCompleted: false,
    adpOnboardingInitiated: false,
    adpOnboardingCompleted: false,
    payRateValidated: false,
    payScheduleValidated: false,
    deductionsValidated: false,
    stateComplianceValidated: false,
    requiresNewStateLicensing: !!homeState,
    newStateIdentified: homeState,
    stateWithholdingAccountCreated: false,
    unemploymentInsuranceAccountCreated: false,
    workersCompPolicyCreated: false,
    classificationVerified: false,
  };
}

// Debug endpoint to check employee data
app.get("/make-server-f8517b5b/employees/debug/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const employees = await kv.getByPrefix("employee:");
    const employee = employees.find((emp: any) => emp.email === email);
    
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }
    
    return c.json({
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      profileCompleted: employee.profileCompleted,
      requiresPasswordReset: employee.requiresPasswordReset,
      temporaryPassword: employee.temporaryPassword,
      workflow: employee.workflow
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return c.json({ error: "Failed to fetch employee debug data", details: String(error) }, 500);
  }
});

// Get all employees
app.get("/make-server-f8517b5b/employees", async (c) => {
  try {
    const needsHRApproval = c.req.query("needsHRApproval");
    const role = c.req.query("role");
    let employees = await kv.getByPrefix("employee:");
    
    // Always filter out incomplete/blank employee records
    employees = (employees || []).filter((emp: any) => 
      emp.firstName && 
      emp.lastName && 
      emp.email
    );
    
    // Auto-fix workflow for employees who completed profile but workflow wasn't updated
    const now = new Date().toISOString();
    for (const employee of employees) {
      if (employee.profileCompleted && employee.workflow?.stages) {
        const employeeSetupStage = employee.workflow.stages.find((s: any) => s.name === 'Employee Setup');
        console.log(`[Auto-fix] Checking employee ${employee.firstName} ${employee.lastName}:`, {
          profileCompleted: employee.profileCompleted,
          hasWorkflow: !!employee.workflow,
          employeeSetupStage: employeeSetupStage?.status
        });
        if (employeeSetupStage && employeeSetupStage.status !== 'completed') {
          console.log(`[Auto-fix] Fixing workflow for employee ${employee.firstName} ${employee.lastName}`);
          // Update the workflow
          const updatedWorkflow = {
            ...employee.workflow,
            stages: employee.workflow.stages.map((stage: any) => {
              if (stage.name === 'Employee Setup') {
                return {
                  ...stage,
                  status: 'completed',
                  completedAt: now,
                  tasks: stage.tasks?.map((task: any) => ({
                    ...task,
                    status: 'completed',
                    completedAt: task.completedAt || now
                  })) || []
                };
              }
              return stage;
            })
          };
          
          // Update current stage to next pending stage
          const currentStageIndex = updatedWorkflow.stages.findIndex((s: any) => s.status === 'pending');
          if (currentStageIndex !== -1) {
            updatedWorkflow.currentStage = updatedWorkflow.stages[currentStageIndex].name;
          }
          
          // Save the updated employee
          const updatedEmployee = { ...employee, workflow: updatedWorkflow };
          await kv.set(`employee:${employee.id}`, updatedEmployee);
          
          // Update the employee in the array
          Object.assign(employee, updatedEmployee);
        }
      }
    }
    
    // Filter for HR approval if requested
    if (needsHRApproval === "true") {
      employees = employees.filter((emp: any) => 
        emp.needsHRApproval === true && 
        emp.hrApproved !== true
      );
    }
    
    // Filter by role if requested
    if (role) {
      employees = employees.filter((emp: any) => 
        emp.role && emp.role.toLowerCase() === role.toLowerCase()
      );
    }
    
    return c.json({ employees: employees || [] });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return c.json({ error: "Failed to fetch employees", details: String(error) }, 500);
  }
});

// Create new employee with workflow
app.post("/make-server-f8517b5b/employees", async (c) => {
  try {
    const body = await c.req.json();

    // NEW SIMPLIFIED WORKFLOW: Only require name, email, and visaStatus
    if (!body.firstName || !body.lastName || !body.email || !body.visaStatus) {
      return c.json({ error: "Missing required fields: firstName, lastName, email, visaStatus" }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Generate employee number (EMP-YYYY-###)
    const year = new Date().getFullYear();
    const existingEmployees = await kv.getByPrefix("employee:");
    const employeeCount = existingEmployees.length + 1;
    const employeeNumber = `EMP-${year}-${String(employeeCount).padStart(3, '0')}`;

    // Check if EAD is required based on visa status
    const visaStatus = body.visaStatus || "";
    const requiresEAD = 
      visaStatus && 
      visaStatus.toLowerCase() !== "us citizen" && 
      visaStatus.toLowerCase() !== "citizen" &&
      visaStatus.toLowerCase() !== "green card holder" &&
      visaStatus.toLowerCase() !== "permanent resident";

    // Initialize onboarding documents array
    const onboardingDocuments = [];
    
    // Add EAD document if required
    if (requiresEAD) {
      onboardingDocuments.push({
        id: crypto.randomUUID(),
        type: "EAD",
        status: "not-uploaded",
        required: true,
        uploadedAt: undefined,
        reviewedAt: undefined,
      });
    }
    
    // Add offer letter and NDA (always required)
    onboardingDocuments.push(
      {
        id: crypto.randomUUID(),
        type: "offer-letter",
        status: "not-uploaded",
        required: true,
        uploadedAt: undefined,
      },
      {
        id: crypto.randomUUID(),
        type: "nda",
        status: "not-uploaded",
        required: true,
        uploadedAt: undefined,
      }
    );

    const newEmployee = {
      id,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone || "",
      dateOfBirth: body.dateOfBirth || "",
      address: body.address || "",
      homeState: body.homeState || "",
      position: body.position || "",
      department: body.department || "",
      startDate: body.startDate || "",
      salary: body.salary || "",
      employmentType: body.employmentType || "full-time",
      visaStatus: visaStatus,
      immigrationStatus: visaStatus, // Keep for compatibility
      visaType: body.visaType || "",
      visaExpiry: body.visaExpiry || "",
      bankAccount: body.bankAccount || "",
      taxId: body.taxId || "",
      onboardingStatus: "in-progress",
      documentsUploaded: false,
      complianceComplete: false,
      canAccessTimesheets: false,
      createdAt: now,
      workflow: createInitialWorkflow(id, body.homeState, false), // Keep minimal workflow for compatibility
      
      // New Document Workflow
      onboardingDocuments,
      eadRequired: requiresEAD,
      eadApproved: false,
      offerLetterSent: false,
      offerLetterSigned: false,
      ndaSent: false,
      ndaSigned: false,
      
      // Client Assignment (Optional during creation) - Support multiple clients
      clientId: body.clientId || "", // Keep for backward compatibility
      clientIds: body.clientIds || (body.clientId ? [body.clientId] : []), // NEW: Array of client IDs
      clientName: body.clientName || "",
      clientNames: body.clientNames || (body.clientName ? [body.clientName] : []), // NEW: Array of client names
      vendorId: body.vendorId || "",
      vendorName: body.vendorName || "",
      purchaseOrderNumber: body.purchaseOrderNumber || "",
      internalProjectId: body.internalProjectId || "",
      
      // Vendor Assignment (Optional during creation)
      vendorId: body.vendorId || "",
      vendorName: body.vendorName || "",
      
      // Payroll Integration
      payrollId: "",
      payrollStatus: "not-setup",
      adpEmployeeId: "",
      
      // Additional Tracking
      employeeNumber,
      managerId: body.managerId || "",
      managerName: body.managerName || "",
      
      // Recruiter/HR workflow tracking
      createdBy: body.createdBy || "unknown",
      createdByRole: body.createdByRole || "unknown",
      needsHRApproval: false, // Not needed in new simplified workflow
      hrApproved: true, // Auto-approve since both HR and Recruiter can create
      
      // Password Management
      temporaryPassword: body.temporaryPassword || "",
      password: "", // Will be set when employee resets their password
      requiresPasswordReset: true, // Force password reset on first login
      profileCompleted: false, // Track if employee has completed their profile
    };

    await kv.set(`employee:${id}`, newEmployee);

    // Auto-create immigration record for the employee (for compatibility with immigration module)
    const immigrationRecord = {
      id: crypto.randomUUID(),
      employeeId: id,
      employeeName: `${body.firstName} ${body.lastName}`,
      email: body.email,
      currentStatus: visaStatus,
      visaType: body.visaType || undefined,
      workAuthorizationExpiry: body.visaExpiry || undefined,
      requiresSponsorship: false,
      hasActiveGCProcess: false,
      cases: [],
      filings: [],
      documents: [],
      dependents: [],
      costs: [],
      auditHistory: [{
        date: now,
        action: "Immigration record auto-created from employee onboarding",
        performedBy: "System"
      }],
      createdAt: now,
      updatedAt: now
    };
    
    await kv.set(`immigration:record:${immigrationRecord.id}`, immigrationRecord);

    // Create notification for employee - welcome and next steps
    const employeeNotification = {
      id: crypto.randomUUID(),
      userId: id,
      userEmail: body.email,
      userName: `${body.firstName} ${body.lastName}`,
      type: "info",
      category: "onboarding",
      title: "Welcome to OneHR! 👋",
      message: `Your employee profile has been created. Please complete your onboarding by uploading the required documents.${requiresEAD ? ' You will need to upload your EAD (Work Authorization Document).' : ''}`,
      priority: "high",
      channels: ["in_app"],
      emailSent: false,
      smsSent: false,
      read: false,
      relatedEntityId: id,
      relatedEntityType: "employee",
      createdAt: now,
    };
    await kv.set(`notification:${employeeNotification.id}`, employeeNotification);

    // Create notification for HR - new employee needs setup
    const hrNotification = {
      id: crypto.randomUUID(),
      userId: "hr-team",
      userEmail: "",
      userName: "HR Team",
      type: "info",
      category: "onboarding",
      title: `New Employee Created - ${body.firstName} ${body.lastName}`,
      message: `${body.firstName} ${body.lastName} has been added to the system and is in the HR Setup stage. Please review and complete the initial setup.`,
      priority: "medium",
      channels: ["in_app"],
      emailSent: false,
      smsSent: false,
      read: false,
      relatedEntityId: id,
      relatedEntityType: "employee",
      createdAt: now,
    };
    await kv.set(`notification:${hrNotification.id}`, hrNotification);

    return c.json({ 
      employee: newEmployee,
      message: `Employee created successfully. ${requiresEAD ? 'Employee must upload EAD upon first login.' : ''}`
    }, 201);
  } catch (error) {
    console.error("Error creating employee:", error);
    return c.json({ error: "Failed to create employee", details: String(error) }, 500);
  }
});

// Get single employee
app.get("/make-server-f8517b5b/employees/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const employee = await kv.get(`employee:${id}`);
    
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }
    
    return c.json({ employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return c.json({ error: "Failed to fetch employee", details: String(error) }, 500);
  }
});

// Update employee information
app.put("/make-server-f8517b5b/employees/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    let employee = await kv.get(`employee:${id}`);
    
    // Auto-create for mock users or first-time saves if email is provided
    if (!employee) {
      if (body.email) {
        console.log(`Creating new employee record for ${body.email} (${id})`);
        employee = {
          id: id,
          email: body.email,
          role: 'employee',
          createdAt: new Date().toISOString(),
          // Default fields to prevent issues
          firstName: body.firstName || '',
          lastName: body.lastName || '',
          clientIds: [],
          clientNames: [],
          workflow: {
            currentStage: 'initiation',
            tasks: [],
            departmentApprovals: []
          }
        };
      } else {
        return c.json({ error: "Employee not found" }, 404);
      }
    }

    const now = new Date().toISOString();

    // Check if this update comes from the employee portal (requiring approval)
    const isEmployeeSelfUpdate = body.source === 'employee_portal' || body.source === 'account_settings';

    if (isEmployeeSelfUpdate) {
       // Identify changes
       const pendingChanges: Record<string, any> = {};
       const fieldsToCheck = [
         'firstName', 'lastName', 'phone', 'phoneNumber', 
         'ssn', 'dateOfBirth', 'address', 'city', 'state', 'zipCode'
       ];

       let hasChanges = false;
       for (const field of fieldsToCheck) {
         if (body[field] !== undefined && body[field] !== employee[field]) {
           pendingChanges[field] = body[field];
           hasChanges = true;
         }
       }

       if (hasChanges) {
         // Store changes as pending
         employee.pendingProfileChanges = {
           ...employee.pendingProfileChanges,
           ...pendingChanges,
           requestedAt: now
         };
         
         await kv.set(`employee:${id}`, employee);

         // Notify HR about pending changes
         try {
            const allUsers = await kv.getByPrefix("user:");
            const hrUsers = (allUsers || []).filter((u: any) => 
              ['hr', 'admin', 'super_admin'].includes(u.role)
            );
            
            for (const user of hrUsers) {
              const notificationId = crypto.randomUUID();
              const notification = {
                id: notificationId,
                userId: user.id,
                userEmail: user.email,
                userName: user.name,
                type: "action_required",
                category: "employee",
                title: "Profile Update Pending Approval",
                message: `${employee.firstName} ${employee.lastName} has requested profile changes.`,
                priority: "high",
                channels: ["in_app"],
                emailSent: false,
                smsSent: false,
                read: false,
                relatedEntityId: id,
                relatedEntityType: "employee",
                createdAt: now,
              };
              await kv.set(`notification:${notificationId}`, notification);
            }
         } catch (err) {
            console.error("Error creating HR notifications:", err);
         }

         return c.json({ 
           employee, 
           message: "Changes submitted for HR approval",
           pendingChanges: true
         });
       } else {
         return c.json({ employee, message: "No changes detected" });
       }
    }

    // Update employee fields
    const updatedEmployee = {
      ...employee,
      firstName: body.firstName || employee.firstName,
      lastName: body.lastName || employee.lastName,
      email: body.email || employee.email,
      phone: body.phone !== undefined ? body.phone : employee.phone,
      phoneNumber: body.phoneNumber !== undefined ? body.phoneNumber : employee.phoneNumber,
      position: body.position !== undefined ? body.position : employee.position,
      department: body.department !== undefined ? body.department : employee.department,
      startDate: body.startDate !== undefined ? body.startDate : employee.startDate,
      homeState: body.homeState !== undefined ? body.homeState : employee.homeState,
      employmentType: body.employmentType || employee.employmentType,
      clientId: body.clientId !== undefined ? body.clientId : employee.clientId,
      clientIds: body.clientIds !== undefined ? body.clientIds : (employee.clientIds || []),
      clientName: body.clientName !== undefined ? body.clientName : employee.clientName,
      clientNames: body.clientNames !== undefined ? body.clientNames : (employee.clientNames || []),
      purchaseOrderNumber: body.purchaseOrderNumber !== undefined ? body.purchaseOrderNumber : employee.purchaseOrderNumber,
      managerId: body.managerId !== undefined ? body.managerId : employee.managerId,
      managerName: body.managerName !== undefined ? body.managerName : employee.managerName,
      // Profile completion fields
      ssn: body.ssn !== undefined ? body.ssn : employee.ssn,
      dateOfBirth: body.dateOfBirth !== undefined ? body.dateOfBirth : employee.dateOfBirth,
      address: body.address !== undefined ? body.address : employee.address,
      city: body.city !== undefined ? body.city : employee.city,
      state: body.state !== undefined ? body.state : employee.state,
      zipCode: body.zipCode !== undefined ? body.zipCode : employee.zipCode,
      profileCompleted: body.profileCompleted !== undefined ? body.profileCompleted : employee.profileCompleted,
      profileCompletedAt: body.profileCompletedAt !== undefined ? body.profileCompletedAt : employee.profileCompletedAt,
      updatedAt: now,
    };

    await kv.set(`employee:${id}`, updatedEmployee);

    // Update associated immigration record if name or email changed
    const immigrationRecords = await kv.getByPrefix("immigration:record:");
    const employeeImmigrationRecord = (immigrationRecords || []).find(
      (record: any) => record.employeeId === id
    );

    if (employeeImmigrationRecord) {
      const needsUpdate = 
        employeeImmigrationRecord.employeeName !== `${updatedEmployee.firstName} ${updatedEmployee.lastName}` ||
        employeeImmigrationRecord.email !== updatedEmployee.email;

      if (needsUpdate) {
        employeeImmigrationRecord.employeeName = `${updatedEmployee.firstName} ${updatedEmployee.lastName}`;
        employeeImmigrationRecord.email = updatedEmployee.email;
        employeeImmigrationRecord.updatedAt = now;
        await kv.set(`immigration:record:${employeeImmigrationRecord.id}`, employeeImmigrationRecord);
      }
    }

    // Notify HR if updated by employee portal
    if (body.source === 'employee_portal') {
      try {
        const allUsers = await kv.getByPrefix("user:");
        const hrUsers = (allUsers || []).filter((u: any) => 
          ['hr', 'admin', 'super_admin'].includes(u.role)
        );
        
        for (const user of hrUsers) {
          const notificationId = crypto.randomUUID();
          const notification = {
            id: notificationId,
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            type: "info",
            category: "employee",
            title: "Employee Profile Updated",
            message: `${updatedEmployee.firstName} ${updatedEmployee.lastName} has updated their profile information.`,
            priority: "medium",
            channels: ["in_app"],
            emailSent: false,
            smsSent: false,
            read: false,
            relatedEntityId: id,
            relatedEntityType: "employee",
            createdAt: now,
          };
          await kv.set(`notification:${notificationId}`, notification);
        }
      } catch (err) {
        console.error("Error creating HR notifications:", err);
      }
    }

    return c.json({ employee: updatedEmployee });
  } catch (error) {
    console.error("Error updating employee:", error);
    return c.json({ error: "Failed to update employee", details: String(error) }, 500);
  }
});

// Approve pending profile changes
app.post("/make-server-f8517b5b/employees/:id/approve-changes", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({})); 

    const employee = await kv.get(`employee:${id}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    if (!employee.pendingProfileChanges) {
      return c.json({ error: "No pending changes to approve" }, 400);
    }

    const { requestedAt, ...changes } = employee.pendingProfileChanges;
    const now = new Date().toISOString();

    // Apply changes
    const updatedEmployee = {
      ...employee,
      ...changes,
      pendingProfileChanges: null, // Clear pending changes
      updatedAt: now
    };

    await kv.set(`employee:${id}`, updatedEmployee);

    // Also update associated immigration record if needed
    if (changes.firstName || changes.lastName || changes.email) {
       const immigrationRecords = await kv.getByPrefix("immigration:record:");
       const employeeImmigrationRecord = (immigrationRecords || []).find(
         (record: any) => record.employeeId === id
       );

       if (employeeImmigrationRecord) {
         employeeImmigrationRecord.employeeName = `${updatedEmployee.firstName} ${updatedEmployee.lastName}`;
         if (changes.email) employeeImmigrationRecord.email = updatedEmployee.email;
         employeeImmigrationRecord.updatedAt = now;
         await kv.set(`immigration:record:${employeeImmigrationRecord.id}`, employeeImmigrationRecord);
       }
    }

    return c.json({ employee: updatedEmployee });
  } catch (error) {
    console.error("Error approving changes:", error);
    return c.json({ error: "Failed to approve changes", details: String(error) }, 500);
  }
});

// Reject pending profile changes
app.post("/make-server-f8517b5b/employees/:id/reject-changes", async (c) => {
  try {
    const id = c.req.param("id");
    
    const employee = await kv.get(`employee:${id}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const updatedEmployee = {
      ...employee,
      pendingProfileChanges: null, // Clear pending changes
      updatedAt: new Date().toISOString()
    };

    await kv.set(`employee:${id}`, updatedEmployee);

    return c.json({ employee: updatedEmployee });
  } catch (error) {
    console.error("Error rejecting changes:", error);
    return c.json({ error: "Failed to reject changes", details: String(error) }, 500);
  }
});

// Delete employee
app.delete("/make-server-f8517b5b/employees/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Check if employee exists
    const employee = await kv.get(`employee:${id}`);
    
    if (!employee) {
      return c.json({ 
        error: "Employee not found"
      }, 404);
    }
    
    // Delete the employee
    await kv.del(`employee:${id}`);

    // Also delete associated immigration record if it exists
    const immigrationRecords = await kv.getByPrefix("immigration:record:");
    const employeeImmigrationRecord = (immigrationRecords || []).find(
      (record: any) => record.employeeId === id
    );

    if (employeeImmigrationRecord) {
      await kv.del(`immigration:record:${employeeImmigrationRecord.id}`);
    }

    // Delete associated documents if any
    const documents = await kv.getByPrefix(`employee:${id}:document:`);
    for (const doc of (documents || [])) {
      if (doc.id) {
        await kv.del(`employee:${id}:document:${doc.id}`);
      }
    }

    return c.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return c.json({ error: "Failed to delete employee", details: String(error) }, 500);
  }
});

// Mark employee onboarding as complete
app.post("/make-server-f8517b5b/employees/:id/complete-onboarding", async (c) => {
  try {
    const id = c.req.param("id");

    const employee = await kv.get(`employee:${id}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const now = new Date().toISOString();

    // Update employee onboarding status and enable timesheet access
    const updatedEmployee = {
      ...employee,
      onboardingStatus: 'completed',
      onboardingCompletedAt: now,
      canAccessTimesheets: true,
      updatedAt: now,
      // Update workflow to reflect completion
      workflow: employee.workflow ? {
        ...employee.workflow,
        currentStage: 'completed',
        tasks: employee.workflow.tasks.map((task: any) => ({
          ...task,
          status: 'completed',
          completedAt: task.completedAt || now
        }))
      } : undefined
    };

    await kv.set(`employee:${id}`, updatedEmployee);

    return c.json({ 
      success: true, 
      message: "Onboarding marked as complete. Employee can now submit timesheets.",
      employee: updatedEmployee 
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return c.json({ error: "Failed to complete onboarding", details: String(error) }, 500);
  }
});

// Employee password reset endpoint
app.post("/make-server-f8517b5b/employees/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return c.json({ error: "Email and new password are required" }, 400);
    }

    // Find employee by email
    const employees = await kv.getByPrefix("employee:");
    const employee = employees.find((emp: any) => emp.email === email);

    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const now = new Date().toISOString();

    // Update workflow to mark "Employee Setup" as completed
    let updatedWorkflow = employee.workflow;
    if (updatedWorkflow && updatedWorkflow.stages) {
      updatedWorkflow = {
        ...updatedWorkflow,
        stages: updatedWorkflow.stages.map((stage: any) => {
          if (stage.name === 'Employee Setup') {
            return {
              ...stage,
              status: 'completed',
              completedAt: now,
              tasks: stage.tasks?.map((task: any) => ({
                ...task,
                status: 'completed',
                completedAt: task.completedAt || now
              })) || []
            };
          }
          return stage;
        })
      };
      
      // Update current stage to next pending stage
      const currentStageIndex = updatedWorkflow.stages.findIndex((s: any) => s.status === 'pending');
      if (currentStageIndex !== -1) {
        updatedWorkflow.currentStage = updatedWorkflow.stages[currentStageIndex].name;
      }
    }

    // Update employee with new password and clear reset flag
    const updatedEmployee = {
      ...employee,
      password: newPassword,
      temporaryPassword: "", // Clear temporary password
      requiresPasswordReset: false,
      profileCompleted: true,
      workflow: updatedWorkflow,
      updatedAt: now,
    };

    await kv.set(`employee:${employee.id}`, updatedEmployee);

    return c.json({ 
      success: true, 
      message: "Password updated successfully",
      employee: updatedEmployee
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return c.json({ error: "Failed to reset password", details: String(error) }, 500);
  }
});

// Toggle timesheet access for employee
app.put("/make-server-f8517b5b/employees/:id/timesheet-access", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const employee = await kv.get(`employee:${id}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const now = new Date().toISOString();

    // Toggle timesheet access
    const updatedEmployee = {
      ...employee,
      canAccessTimesheets: body.canAccessTimesheets,
      updatedAt: now,
    };

    await kv.set(`employee:${id}`, updatedEmployee);

    return c.json({ 
      success: true, 
      message: body.canAccessTimesheets 
        ? "Timesheet access granted" 
        : "Timesheet access revoked",
      employee: updatedEmployee 
    });
  } catch (error) {
    console.error("Error toggling timesheet access:", error);
    return c.json({ error: "Failed to toggle timesheet access", details: String(error) }, 500);
  }
});

// Update workflow task
app.put("/make-server-f8517b5b/employees/:id/workflow/tasks/:taskId", async (c) => {
  try {
    const id = c.req.param("id");
    const taskId = c.req.param("taskId");
    const body = await c.req.json();

    const employee = await kv.get(`employee:${id}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    if (!employee.workflow) {
      return c.json({ error: "No workflow found for employee" }, 404);
    }

    const now = new Date().toISOString();
    
    // Update the specific task
    employee.workflow.tasks = employee.workflow.tasks.map((task: any) => {
      if (task.id === taskId) {
        return {
          ...task,
          ...body,
          completedBy: body.status === 'completed' ? 'User' : task.completedBy,
          completedDate: body.status === 'completed' ? now : task.completedDate,
        };
      }
      return task;
    });

    // Check if we should advance the stage
    const completedTasks = employee.workflow.tasks.filter((t: any) => t.status === 'completed').length;
    const totalTasks = employee.workflow.tasks.length;
    
    if (completedTasks === totalTasks) {
      employee.workflow.currentStage = 'completed';
      employee.onboardingStatus = 'completed';
    }

    await kv.set(`employee:${id}`, employee);

    return c.json({ employee });
  } catch (error) {
    console.error("Error updating task:", error);
    return c.json({ error: "Failed to update task", details: String(error) }, 500);
  }
});

// Update department approval
app.put("/make-server-f8517b5b/employees/:id/workflow/approvals", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const employee = await kv.get(`employee:${id}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    if (!employee.workflow) {
      return c.json({ error: "No workflow found for employee" }, 404);
    }

    const now = new Date().toISOString();
    
    // Update the specific department approval
    employee.workflow.departmentApprovals = employee.workflow.departmentApprovals.map((approval: any) => {
      if (approval.department === body.department) {
        return {
          ...approval,
          status: body.approved ? 'approved' : 'rejected',
          approvedBy: 'User',
          approvedDate: now,
          notes: body.notes || approval.notes,
        };
      }
      return approval;
    });

    // Check if all approvals are granted
    const allApproved = employee.workflow.departmentApprovals.every(
      (approval: any) => approval.status === 'approved'
    );
    
    if (allApproved && employee.workflow.classificationVerified) {
      employee.canAccessTimesheets = true;
    }

    await kv.set(`employee:${id}`, employee);

    return c.json({ employee });
  } catch (error) {
    console.error("Error updating approval:", error);
    return c.json({ error: "Failed to update approval", details: String(error) }, 500);
  }
});

// Update employee classification
app.put("/make-server-f8517b5b/employees/:id/classification", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const employee = await kv.get(`employee:${id}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    if (!employee.workflow) {
      return c.json({ error: "No workflow found for employee" }, 404);
    }

    const now = new Date().toISOString();
    
    // Update classification
    employee.classification = body.classification;
    employee.isBillable = body.classification === 'billable';
    employee.isOperational = body.classification === 'operational';
    
    employee.workflow.employeeClassification = body.classification;
    employee.workflow.linkedClientId = body.linkedClientId;
    employee.workflow.linkedClientName = body.linkedClientName;
    employee.workflow.linkedPONumber = body.linkedPONumber;
    employee.workflow.internalProjectId = body.internalProjectId;
    employee.workflow.departmentAssignment = body.departmentAssignment;
    employee.workflow.classificationVerified = true;

    // Validate classification requirements
    if (body.classification === 'billable' && (!body.linkedClientName || !body.linkedPONumber)) {
      employee.workflow.classificationVerified = false;
      return c.json({ error: "Billable employees must have client and PO number" }, 400);
    }

    if (body.classification === 'non-billable' && !body.internalProjectId) {
      employee.workflow.classificationVerified = false;
      return c.json({ error: "Non-billable employees must be assigned to internal project" }, 400);
    }

    if (body.classification === 'operational' && !body.departmentAssignment) {
      employee.workflow.classificationVerified = false;
      return c.json({ error: "Operational employees must be assigned to a department" }, 400);
    }

    // Check if employee can now access timesheets
    const allApproved = employee.workflow.departmentApprovals.every(
      (approval: any) => approval.status === 'approved'
    );
    
    if (allApproved && employee.workflow.classificationVerified) {
      employee.canAccessTimesheets = true;
    }

    await kv.set(`employee:${id}`, employee);

    return c.json({ employee });
  } catch (error) {
    console.error("Error updating classification:", error);
    return c.json({ error: "Failed to update classification", details: String(error) }, 500);
  }
});

// Upload employee documents (Resume, Driver's License, etc.)
app.post("/make-server-f8517b5b/employees/:employeeId/documents", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    
    // Verify employee exists
    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    // Parse form data
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;
    
    if (!file || !type) {
      return c.json({ error: "Missing file or type" }, 400);
    }

    const now = new Date().toISOString();
    const documentId = crypto.randomUUID();
    
    // Create document metadata
    const document = {
      id: documentId,
      employeeId,
      documentType: type,
      documentName: file.name,
      fileName: file.name,
      fileSize: file.size,
      uploadDate: now,
      uploadedBy: "Recruiter",
      verificationStatus: "pending",
      notes: `${type} uploaded during employee onboarding`,
    };

    // Store document metadata
    await kv.set(`employee:document:${documentId}`, document);
    
    // Add document reference to employee record
    if (!employee.documents) {
      employee.documents = [];
    }
    employee.documents.push(document);
    employee.updatedAt = now;
    await kv.set(`employee:${employeeId}`, employee);

    console.log(`Document uploaded for employee ${employeeId}: ${type} - ${file.name}`);

    return c.json({ 
      success: true, 
      document,
      message: `${type} uploaded successfully` 
    }, 201);
  } catch (error) {
    console.error("Error uploading employee document:", error);
    return c.json({ 
      error: "Failed to upload document", 
      details: String(error) 
    }, 500);
  }
});

// ============================================
// DOCUMENT MANAGEMENT ENDPOINTS
// ============================================

// Get all documents
app.get("/make-server-f8517b5b/documents", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    console.log("Fetching documents for employeeId:", employeeId);
    let allItems = await kv.getByPrefix("document:");
    console.log("All items with 'document:' prefix:", allItems?.length || 0);
    
    // Filter to get only actual documents (not document requests)
    // Document requests have keys like "document:request:xxx" and have employeeName field
    // Actual documents have keys like "document:xxx" and have fileName field
    let documents = (allItems || []).filter((d: any) => {
      // Must have fileName OR documentName to be a real document (not a request)
      // And must NOT have employeeName (which is only in document requests)
      const hasFileName = d.fileName !== undefined && d.fileName !== null && d.fileName !== '';
      const hasDocumentName = d.documentName !== undefined && d.documentName !== null && d.documentName !== '';
      const isNotRequest = !d.employeeName && !d.employeeEmail;
      const isDocument = (hasFileName || hasDocumentName) && isNotRequest;
      
      if (isDocument) {
        console.log("Document found:", { id: d.id, fileName: d.fileName, documentName: d.documentName, documentType: d.documentType, employeeId: d.employeeId });
      }
      return isDocument;
    });
    
    console.log("Documents after filtering (before employeeId filter):", documents.length);
    
    // Filter by employeeId if provided
    if (employeeId) {
      documents = documents.filter((d: any) => d.employeeId === employeeId);
      console.log("Documents after employeeId filter:", documents.length);
      
      // Also fetch onboarding documents from the employee record
      const employee = await kv.get(`employee:${employeeId}`);
      if (employee && Array.isArray(employee.onboardingDocuments)) {
        console.log("Found onboarding documents:", employee.onboardingDocuments.length);
        
        // Transform onboarding documents to match the document structure
        const onboardingDocs = employee.onboardingDocuments
          .filter((doc: any) => doc.status === 'approved' || doc.status === 'pending-review' || doc.status === 'rejected')
          .map((doc: any) => ({
            id: doc.id,
            employeeId: employeeId,
            documentType: doc.type,
            documentName: doc.fileName || doc.type,
            fileName: doc.fileName || '',
            fileSize: doc.fileSize || 0,
            uploadDate: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
            uploadedBy: doc.uploadedBy || employee.firstName + ' ' + employee.lastName,
            expiryDate: doc.expiryDate || '',
            status: doc.status === 'approved' ? 'verified' : doc.status === 'pending-review' ? 'pending' : 'rejected',
            verificationStatus: doc.status === 'approved' ? 'verified' : doc.status === 'pending-review' ? 'pending' : 'rejected',
            notes: doc.notes || '',
            category: 'Onboarding',
            filePath: doc.filePath || '',
            storageBucket: doc.storageBucket || '',
            fileUrl: doc.fileUrl || '',
            // Keep original onboarding document info
            isOnboardingDocument: true,
            requestedBy: doc.requestedBy,
            requestedAt: doc.requestedAt,
            requestNotes: doc.requestNotes,
            approvedBy: doc.approvedBy,
            approvedAt: doc.approvedAt,
            rejectedBy: doc.rejectedBy,
            rejectedAt: doc.rejectedAt,
            rejectionReason: doc.rejectionReason
          }));
        
        // Add onboarding documents to the list
        documents = [...documents, ...onboardingDocs];
        console.log("Total documents including onboarding:", documents.length);
      }
    }
    
    return c.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return c.json({ error: "Failed to fetch documents" }, 500);
  }
});

// Upload document
app.post("/make-server-f8517b5b/documents/upload", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const document = {
      id,
      employeeId: body.employeeId,
      documentType: body.documentType,
      documentName: body.documentName,
      fileName: body.fileName || body.documentName,
      fileSize: body.fileSize || 0,
      uploadDate: now,
      uploadedBy: body.uploadedBy || "System",
      expiryDate: body.expiryDate || "",
      requiresSignature: body.requiresSignature || false,
      signatureStatus: body.requiresSignature ? "pending" : "not-required",
      version: 1,
      status: "active",
      notes: body.notes || "",
      verificationStatus: "pending",
    };

    console.log("Creating document:", { id, employeeId: document.employeeId, fileName: document.fileName, documentName: document.documentName });
    await kv.set(`document:${id}`, document);
    console.log("Document saved successfully");

    // Check if this fulfills a document request
    const allRequests = await kv.getByPrefix("document:request:");
    const matchingRequest = (allRequests || []).find((r: any) => 
      r.employeeId === body.employeeId && 
      r.documentType === body.documentType &&
      (r.status === 'pending' || r.status === 'overdue')
    );

    if (matchingRequest) {
      matchingRequest.status = 'uploaded';
      matchingRequest.uploadedDate = now;
      matchingRequest.documentId = id;
      await kv.set(`document:request:${matchingRequest.id}`, matchingRequest);

      // Update employee workflow
      const employee = await kv.get(`employee:${body.employeeId}`);
      if (employee && employee.workflow && employee.workflow.pendingDocumentRequests > 0) {
        employee.workflow.pendingDocumentRequests--;
        await kv.set(`employee:${body.employeeId}`, employee);
      }
    }

    return c.json({ document }, 201);
  } catch (error) {
    console.error("Error uploading document:", error);
    return c.json({ error: "Failed to upload document" }, 500);
  }
});

// Upload actual file to Supabase Storage
app.post("/make-server-f8517b5b/documents/upload-file", async (c) => {
  try {
    console.log("📁 File upload request received");
    
    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const employeeId = formData.get('employeeId') as string;
    
    if (!file || !documentId) {
      return c.json({ error: "Missing file or documentId" }, 400);
    }
    
    console.log(`Uploading file: ${file.name}, size: ${file.size}, documentId: ${documentId}`);
    
    // Initialize Supabase client
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Create bucket if it doesn't exist
    const bucketName = 'make-f8517b5b-employee-documents';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      if (createError) {
        console.error("Error creating bucket:", createError);
        return c.json({ error: "Failed to create storage bucket", details: String(createError) }, 500);
      }
    }
    
    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Upload file to storage
    const filePath = `${employeeId}/${documentId}/${file.name}`;
    console.log(`Uploading to path: ${filePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
      });
    
    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return c.json({ error: "Failed to upload file", details: String(uploadError) }, 500);
    }
    
    console.log("File uploaded successfully:", uploadData);
    
    // Update document metadata with file path
    const document = await kv.get(`document:${documentId}`);
    if (document) {
      document.filePath = filePath;
      document.storageBucket = bucketName;
      document.fileUploaded = true;
      await kv.set(`document:${documentId}`, document);
      console.log("Document metadata updated with file path");
    }
    
    return c.json({ 
      success: true, 
      filePath,
      message: "File uploaded successfully" 
    }, 201);
  } catch (error) {
    console.error("Error in file upload:", error);
    return c.json({ error: "Failed to upload file", details: String(error) }, 500);
  }
});

// Upload User Avatar
app.post("/make-server-f8517b5b/users/:id/avatar", async (c) => {
  try {
    const userId = c.req.param("id");
    const body = await c.req.parseBody();
    const file = body["avatar"];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // Initialize Supabase client
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const bucketName = "user-avatars";
    
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB limit for avatars
      });
      if (createError) {
        console.error("Error creating bucket:", createError);
        return c.json({ error: "Failed to create storage bucket", details: String(createError) }, 500);
      }
    }
    
    // Upload file
    // Use a fixed name 'avatar' + extension to overwrite previous avatars easily
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
      });
      
    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return c.json({ error: "Failed to upload avatar", details: String(uploadError) }, 500);
    }

    // Generate signed URL immediately
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry
      
    if (signedUrlError) {
      console.error("Error generating signed URL:", signedUrlError);
      return c.json({ error: "Failed to generate signed URL", details: String(signedUrlError) }, 500);
    }

    // Update User Record in KV
    // Need to find user by ID first to determine key prefix (user: or employee:)
    let userKey = `user:${userId}`;
    let user = await kv.get(userKey);
    
    if (!user) {
      userKey = `employee:${userId}`;
      user = await kv.get(userKey);
    }
    
    if (user) {
      user.avatarPath = filePath;
      user.avatarBucket = bucketName;
      // We can optionally store the signed URL, but it expires. 
      // It's better to return it and let frontend handle state, 
      // or store it but refresh it when expired.
      // For simplicity, let's just return it.
      await kv.set(userKey, user);
    }

    return c.json({ 
      success: true, 
      avatarUrl: signedUrlData.signedUrl 
    });

  } catch (error) {
    console.error("Error uploading avatar:", error);
    return c.json({ error: "Failed to upload avatar", details: String(error) }, 500);
  }
});

// Get User Avatar URL
app.get("/make-server-f8517b5b/users/:id/avatar-url", async (c) => {
  try {
    const userId = c.req.param("id");
    
    // Find user
    let user = await kv.get(`user:${userId}`);
    if (!user) {
      user = await kv.get(`employee:${userId}`);
    }
    
    if (!user || !user.avatarPath || !user.avatarBucket) {
      return c.json({ avatarUrl: null });
    }

    // Initialize Supabase client
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(user.avatarBucket)
      .createSignedUrl(user.avatarPath, 60 * 60 * 24 * 7); // 7 days
      
    if (signedUrlError) {
      console.error("Error generating signed URL:", signedUrlError);
      return c.json({ error: "Failed to generate URL" }, 500);
    }

    return c.json({ avatarUrl: signedUrlData.signedUrl });
  } catch (error) {
    console.error("Error fetching avatar URL:", error);
    return c.json({ error: "Failed to fetch avatar URL", details: String(error) }, 500);
  }
});

// Download actual file from Supabase Storage
app.get("/make-server-f8517b5b/documents/:id/download-file", async (c) => {
  try {
    const id = c.req.param("id");
    console.log(`📥 Download request for document: ${id}`);
    
    // Get document metadata - check both generic and client document prefixes
    let document = await kv.get(`document:${id}`);
    if (!document) {
      document = await kv.get(`client:document:${id}`);
    }
    
    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }
    
    // Check if actual file was uploaded
    if (!document.filePath || !document.storageBucket) {
      console.log("No file uploaded for this document, metadata only");
      return c.json({ 
        error: "No file available",
        message: "This document only has metadata. The actual file was not uploaded.",
        metadataOnly: true
      }, 404);
    }
    
    console.log(`Retrieving file from: ${document.storageBucket}/${document.filePath}`);
    
    // Initialize Supabase client
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Create signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(document.storageBucket)
      .createSignedUrl(document.filePath, 3600);
    
    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return c.json({ error: "Failed to generate download URL", details: String(signedUrlError) }, 500);
    }
    
    console.log("Signed URL created successfully");
    
    return c.json({ 
      url: signedUrlData.signedUrl,
      fileName: document.fileName,
      fileSize: document.fileSize
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return c.json({ error: "Failed to download file", details: String(error) }, 500);
  }
});

// Update document
app.put("/make-server-f8517b5b/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const document = await kv.get(`document:${id}`);
    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    // Update allowed fields
    const updatedDocument = {
      ...document,
      documentName: body.documentName !== undefined ? body.documentName : document.documentName,
      expiryDate: body.expiryDate !== undefined ? body.expiryDate : document.expiryDate,
      notes: body.notes !== undefined ? body.notes : document.notes,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`document:${id}`, updatedDocument);
    return c.json({ document: updatedDocument });
  } catch (error) {
    console.error("Error updating document:", error);
    return c.json({ error: "Failed to update document" }, 500);
  }
});

// Verify or reject document (HR action)
app.put("/make-server-f8517b5b/documents/:id/verify", async (c) => {
  try {
    const id = c.req.param("id");
    console.log(`[Verify Document] Starting verification for document ID: ${id}`);
    
    let body;
    try {
      body = await c.req.json();
      console.log(`[Verify Document] Request body:`, body);
    } catch (e) {
      console.error(`[Verify Document] Failed to parse request body:`, e);
      return c.json({ error: "Invalid request body", details: String(e) }, 400);
    }
    
    // Try to find document with multiple key formats
    let document = await kv.get(`document:${id}`);
    let documentKey = `document:${id}`;
    
    if (!document) {
      console.log(`[Verify Document] Not found with 'document:' prefix, trying 'employee-document:' prefix`);
      document = await kv.get(`employee-document:${id}`);
      documentKey = `employee-document:${id}`;
    }
    
    if (!document) {
      console.error(`[Verify Document] Document not found with any key format: ${id}`);
      return c.json({ error: "Document not found" }, 404);
    }

    console.log(`[Verify Document] Found document:`, { id: document.id, employeeId: document.employeeId, documentType: document.documentType, key: documentKey });

    const now = new Date().toISOString();
    const verificationStatus = body.verificationStatus; // 'verified' or 'rejected'
    
    if (!verificationStatus || !['verified', 'rejected'].includes(verificationStatus)) {
      console.error(`[Verify Document] Invalid verification status: ${verificationStatus}`);
      return c.json({ error: "Invalid verification status. Must be 'verified' or 'rejected'" }, 400);
    }
    
    // Update document with verification details
    const updatedDocument = {
      ...document,
      verificationStatus,
      verifiedBy: body.verifiedBy || "HR Admin",
      verifiedDate: now,
      rejectionReason: verificationStatus === 'rejected' ? body.rejectionReason : undefined,
      updatedAt: now,
    };

    console.log(`[Verify Document] Updating document with status: ${verificationStatus}`);
    await kv.set(documentKey, updatedDocument);
    console.log(`[Verify Document] Document ${id} ${verificationStatus} by ${updatedDocument.verifiedBy}`);

    // If verified, update any matching document request to 'verified' status
    if (verificationStatus === 'verified' && document.employeeId) {
      console.log(`[Verify Document] Looking for matching document request...`);
      const allRequests = await kv.getByPrefix("document:request:");
      const matchingRequest = (allRequests || []).find((r: any) => 
        r.employeeId === document.employeeId && 
        r.documentType === document.documentType &&
        (r.status === 'uploaded' || r.status === 'pending' || r.status === 'overdue')
      );

      if (matchingRequest) {
        matchingRequest.status = 'verified';
        matchingRequest.verifiedDate = now;
        matchingRequest.documentId = id;
        await kv.set(`document:request:${matchingRequest.id}`, matchingRequest);
        console.log(`[Verify Document] Updated document request ${matchingRequest.id} to verified status`);
      } else {
        console.log(`[Verify Document] No matching document request found`);
      }
    }

    console.log(`[Verify Document] Successfully completed verification`);
    return c.json({ document: updatedDocument });
  } catch (error) {
    console.error("[Verify Document] Error verifying document:", error);
    console.error("[Verify Document] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ 
      error: "Failed to verify document", 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// Delete document
app.delete("/make-server-f8517b5b/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`document:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return c.json({ error: "Failed to delete document" }, 500);
  }
});

// ============================================
// ONBOARDING DOCUMENT WORKFLOW ENDPOINTS
// ============================================

// Employee uploads onboarding document (EAD)
app.post("/make-server-f8517b5b/employees/:employeeId/onboarding-document", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const body = await c.req.json();
    
    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const now = new Date().toISOString();
    const docType = body.documentType; // 'EAD', 'offer-letter-signed', 'nda-signed'
    
    // Find the document in onboardingDocuments array
    const docIndex = employee.onboardingDocuments?.findIndex((d: any) => d.type === docType);
    if (docIndex === -1 || docIndex === undefined) {
      return c.json({ error: "Document type not found in onboarding workflow" }, 404);
    }

    // Update the document status
    employee.onboardingDocuments[docIndex] = {
      ...employee.onboardingDocuments[docIndex],
      status: "pending-review",
      uploadedBy: body.uploadedBy || employee.email,
      uploadedAt: now,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
    };

    // Update employee flags
    if (docType === "EAD") {
      employee.eadApproved = false; // Pending HR approval
    } else if (docType === "offer-letter-signed") {
      employee.offerLetterSigned = true;
    } else if (docType === "nda-signed") {
      employee.ndaSigned = true;
    }

    await kv.set(`employee:${employeeId}`, employee);

    // Create notification for HR - document awaiting review
    const hrNotification = {
      id: crypto.randomUUID(),
      userId: "hr-team",
      userEmail: "",
      userName: "HR Team",
      type: "approval",
      category: "onboarding",
      title: `Document Pending Review - ${employee.firstName} ${employee.lastName}`,
      message: `${employee.firstName} ${employee.lastName} has uploaded their ${docType} document and it's waiting for your review.`,
      priority: "high",
      channels: ["in_app"],
      emailSent: false,
      smsSent: false,
      read: false,
      relatedEntityId: employeeId,
      relatedEntityType: "employee",
      metadata: {
        documentType: docType,
        employeeName: `${employee.firstName} ${employee.lastName}`,
      },
      createdAt: now,
    };
    await kv.set(`notification:${hrNotification.id}`, hrNotification);

    return c.json({ 
      employee,
      message: `${docType} uploaded successfully and pending HR review`
    });
  } catch (error) {
    console.error("Error uploading onboarding document:", error);
    return c.json({ error: "Failed to upload document", details: String(error) }, 500);
  }
});

// HR approves/rejects onboarding document
app.put("/make-server-f8517b5b/employees/:employeeId/onboarding-document/:documentType/review", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const documentType = c.req.param("documentType");
    const body = await c.req.json();
    
    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const now = new Date().toISOString();
    const approved = body.approved; // boolean
    const reviewNotes = body.reviewNotes || "";
    
    // Find the document in onboardingDocuments array
    const docIndex = employee.onboardingDocuments?.findIndex((d: any) => d.type === documentType);
    if (docIndex === -1 || docIndex === undefined) {
      return c.json({ error: "Document type not found in onboarding workflow" }, 404);
    }

    // Update the document status
    employee.onboardingDocuments[docIndex] = {
      ...employee.onboardingDocuments[docIndex],
      status: approved ? "approved" : "rejected",
      reviewedBy: body.reviewedBy || "HR",
      reviewedAt: now,
      reviewNotes,
    };

    // Update employee flags
    if (documentType === "EAD") {
      employee.eadApproved = approved;
    }

    // Check if all required documents are approved
    const allDocsApproved = employee.onboardingDocuments.every((d: any) => 
      !d.required || d.status === "approved"
    );

    if (allDocsApproved) {
      employee.onboardingStatus = "completed";
      employee.canAccessTimesheets = true;
      
      // Create notification for employee - onboarding completed
      const completionNotification = {
        id: crypto.randomUUID(),
        userId: employeeId,
        userEmail: employee.email || "",
        userName: `${employee.firstName} ${employee.lastName}`,
        type: "confirmation",
        category: "onboarding",
        title: "Onboarding Complete! 🎉",
        message: `Congratulations! Your onboarding is now complete. You can now access the timesheet system.`,
        priority: "high",
        channels: ["in_app"],
        emailSent: false,
        smsSent: false,
        read: false,
        relatedEntityId: employeeId,
        relatedEntityType: "employee",
        createdAt: now,
      };
      await kv.set(`notification:${completionNotification.id}`, completionNotification);
    }

    await kv.set(`employee:${employeeId}`, employee);

    // Create notification for employee about document review
    const notification = {
      id: crypto.randomUUID(),
      userId: employeeId,
      userEmail: employee.email || "",
      userName: `${employee.firstName} ${employee.lastName}`,
      type: approved ? "confirmation" : "alert",
      category: "document",
      title: approved 
        ? `Document Approved - ${documentType}` 
        : `Document Rejected - ${documentType}`,
      message: approved 
        ? `Your ${documentType} has been approved by HR.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`
        : `Your ${documentType} was rejected by HR. ${reviewNotes || 'Please upload a corrected version.'}`,
      priority: approved ? "medium" : "high",
      channels: ["in_app"],
      emailSent: false,
      smsSent: false,
      read: false,
      relatedEntityId: employeeId,
      relatedEntityType: "employee",
      createdAt: now,
    };
    
    await kv.set(`notification:${notification.id}`, notification);

    return c.json({ 
      employee,
      message: approved 
        ? `${documentType} approved successfully`
        : `${documentType} rejected`
    });
  } catch (error) {
    console.error("Error reviewing onboarding document:", error);
    return c.json({ error: "Failed to review document", details: String(error) }, 500);
  }
});

// HR sends offer letter/NDA to employee
app.post("/make-server-f8517b5b/employees/:employeeId/send-document", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const body = await c.req.json();
    
    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const now = new Date().toISOString();
    const docType = body.documentType; // 'offer-letter' or 'nda'
    
    // Find the document in onboardingDocuments array
    const docIndex = employee.onboardingDocuments?.findIndex((d: any) => d.type === docType);
    if (docIndex === -1 || docIndex === undefined) {
      return c.json({ error: "Document type not found in onboarding workflow" }, 404);
    }

    // Update the document - HR has uploaded it
    employee.onboardingDocuments[docIndex] = {
      ...employee.onboardingDocuments[docIndex],
      status: "pending-review", // Waiting for employee to sign
      uploadedBy: body.uploadedBy || "HR",
      uploadedAt: now,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
    };

    // Update employee flags
    if (docType === "offer-letter") {
      employee.offerLetterSent = true;
    } else if (docType === "nda") {
      employee.ndaSent = true;
    }

    // Add corresponding signed document to onboardingDocuments if not exists
    const signedDocType = `${docType}-signed`;
    const signedDocExists = employee.onboardingDocuments?.some((d: any) => d.type === signedDocType);
    
    if (!signedDocExists) {
      employee.onboardingDocuments.push({
        id: crypto.randomUUID(),
        type: signedDocType,
        status: "not-uploaded",
        required: true,
        uploadedAt: undefined,
      });
    }

    await kv.set(`employee:${employeeId}`, employee);

    return c.json({ 
      employee,
      message: `${docType} sent to employee successfully`
    });
  } catch (error) {
    console.error("Error sending document:", error);
    return c.json({ error: "Failed to send document", details: String(error) }, 500);
  }
});

// HR requests additional documents from employee
app.post("/make-server-f8517b5b/employees/:employeeId/request-documents", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const body = await c.req.json();
    const { documentTypes, notes } = body; // documentTypes is an array of strings
    
    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    if (!documentTypes || !Array.isArray(documentTypes) || documentTypes.length === 0) {
      return c.json({ error: "documentTypes array is required" }, 400);
    }

    const now = new Date().toISOString();
    
    // Initialize onboardingDocuments if it doesn't exist
    if (!employee.onboardingDocuments) {
      employee.onboardingDocuments = [];
    }

    // Add each requested document type to onboardingDocuments
    for (const docType of documentTypes) {
      // Check if document already exists
      const existingDoc = employee.onboardingDocuments.find((d: any) => d.type === docType);
      
      if (!existingDoc) {
        employee.onboardingDocuments.push({
          id: crypto.randomUUID(),
          type: docType,
          status: "not-uploaded",
          required: true,
          requestedAt: now,
          requestedBy: "HR",
          notes: notes || ""
        });
      }
    }

    await kv.set(`employee:${employeeId}`, employee);

    return c.json({ 
      employee,
      message: `Requested ${documentTypes.length} document(s) from employee`
    });
  } catch (error) {
    console.error("Error requesting documents:", error);
    return c.json({ error: "Failed to request documents", details: String(error) }, 500);
  }
});

// HR sends offer letter to employee
app.post("/make-server-f8517b5b/employees/:employeeId/send-offer-letter", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    
    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const now = new Date().toISOString();
    
    // Initialize onboardingDocuments if it doesn't exist
    if (!employee.onboardingDocuments) {
      employee.onboardingDocuments = [];
    }

    // Find or create offer letter document
    let offerLetterDoc = employee.onboardingDocuments.find(
      (d: any) => d.type === "offer-letter"
    );

    if (offerLetterDoc) {
      // Update existing
      offerLetterDoc.status = "sent";
      offerLetterDoc.sentAt = now;
      offerLetterDoc.sentBy = "HR";
    } else {
      // Create new
      employee.onboardingDocuments.push({
        id: crypto.randomUUID(),
        type: "offer-letter",
        status: "sent",
        required: true,
        sentAt: now,
        sentBy: "HR"
      });
    }

    // Add or update offer-letter-signed document (employee needs to sign)
    let signedDoc = employee.onboardingDocuments.find(
      (d: any) => d.type === "offer-letter-signed"
    );

    if (!signedDoc) {
      employee.onboardingDocuments.push({
        id: crypto.randomUUID(),
        type: "offer-letter-signed",
        status: "not-uploaded",
        required: true,
        requestedAt: now
      });
    }

    employee.offerLetterSent = true;
    employee.offerLetterSentAt = now;

    await kv.set(`employee:${employeeId}`, employee);

    return c.json({ 
      employee,
      message: "Offer letter sent successfully. Employee will receive notification to sign."
    });
  } catch (error) {
    console.error("Error sending offer letter:", error);
    return c.json({ error: "Failed to send offer letter", details: String(error) }, 500);
  }
});

// HR sends NDA to employee
app.post("/make-server-f8517b5b/employees/:employeeId/send-nda", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    
    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const now = new Date().toISOString();
    
    // Initialize onboardingDocuments if it doesn't exist
    if (!employee.onboardingDocuments) {
      employee.onboardingDocuments = [];
    }

    // Find or create NDA document
    let ndaDoc = employee.onboardingDocuments.find(
      (d: any) => d.type === "nda"
    );

    if (ndaDoc) {
      // Update existing
      ndaDoc.status = "sent";
      ndaDoc.sentAt = now;
      ndaDoc.sentBy = "HR";
    } else {
      // Create new
      employee.onboardingDocuments.push({
        id: crypto.randomUUID(),
        type: "nda",
        status: "sent",
        required: true,
        sentAt: now,
        sentBy: "HR"
      });
    }

    // Add or update nda-signed document (employee needs to sign)
    let signedDoc = employee.onboardingDocuments.find(
      (d: any) => d.type === "nda-signed"
    );

    if (!signedDoc) {
      employee.onboardingDocuments.push({
        id: crypto.randomUUID(),
        type: "nda-signed",
        status: "not-uploaded",
        required: true,
        requestedAt: now
      });
    }

    employee.ndaSent = true;
    employee.ndaSentAt = now;

    await kv.set(`employee:${employeeId}`, employee);

    return c.json({ 
      employee,
      message: "NDA sent successfully. Employee will receive notification to sign."
    });
  } catch (error) {
    console.error("Error sending NDA:", error);
    return c.json({ error: "Failed to send NDA", details: String(error) }, 500);
  }
});

// ============================================
// DOCUMENT REQUEST ENDPOINTS (Req 3.3)
// ============================================

// Get document requests for an employee
app.get("/make-server-f8517b5b/document-requests", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    const allRequests = await kv.getByPrefix("document:request:");
    
    let requests = allRequests || [];
    if (employeeId) {
      requests = requests.filter((r: any) => r.employeeId === employeeId);
    }

    // Update overdue status
    const now = new Date();
    for (const request of requests) {
      if (request.status === 'pending' && new Date(request.dueDate) < now) {
        request.status = 'overdue';
        await kv.set(`document:request:${request.id}`, request);
      }
    }

    return c.json({ requests });
  } catch (error) {
    console.error("Error fetching document requests:", error);
    return c.json({ error: "Failed to fetch document requests" }, 500);
  }
});

// Auto-create mandatory document requests for new employee
app.post("/make-server-f8517b5b/document-requests/auto-create", async (c) => {
  try {
    const body = await c.req.json();
    const { employeeId, employeeName, employeeEmail, startDate } = body;

    if (!employeeId || !employeeName || !employeeEmail) {
      return c.text("Missing required fields: employeeId, employeeName, employeeEmail", 400);
    }

    const now = new Date();
    const dueDate = startDate ? new Date(startDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now or start date

    const mandatoryDocuments = [
      { type: 'Government-issued ID', notes: 'Please upload a clear copy of your government-issued ID (Driver\'s License, State ID, or Passport)' },
      { type: 'Address Proof', notes: 'Upload a recent utility bill, lease agreement, or bank statement showing your current address' },
      { type: 'Work Authorization', notes: 'Upload proof of work authorization (EAD, Visa, Green Card, or I-94)' },
      { type: 'I-9 Form', notes: 'Complete and upload the I-9 Employment Eligibility Verification form' },
      { type: 'W-4 Form', notes: 'Complete and upload the W-4 tax withholding form' },
      { type: 'Direct Deposit Form', notes: 'Upload completed direct deposit authorization form' }
    ];

    const createdRequests = [];
    for (const doc of mandatoryDocuments) {
      const requestId = crypto.randomUUID();
      const documentRequest = {
        id: requestId,
        employeeId,
        employeeName,
        employeeEmail,
        documentType: doc.type,
        notes: doc.notes,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending',
        createdAt: now.toISOString(),
        requestedBy: 'HR Onboarding System'
      };

      await kv.set(`document:request:${requestId}`, documentRequest);
      createdRequests.push(documentRequest);
    }

    // Update employee workflow
    const employee = await kv.get(`employee:${employeeId}`);
    if (employee && employee.workflow) {
      employee.workflow.pendingDocumentRequests = mandatoryDocuments.length;
      await kv.set(`employee:${employeeId}`, employee);
    }

    return c.json({ 
      requests: createdRequests,
      message: `${mandatoryDocuments.length} mandatory document requests created successfully`
    }, 201);
  } catch (error) {
    console.error("Error auto-creating document requests:", error);
    return c.text(`Failed to create document requests: ${error}`, 500);
  }
});

// Update document request
app.put("/make-server-f8517b5b/document-requests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const request = await kv.get(`document:request:${id}`);
    if (!request) {
      return c.text("Document request not found", 404);
    }

    const updatedRequest = {
      ...request,
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // If status is being updated to 'uploaded', set uploadedDate
    if (body.status === 'uploaded' && request.status !== 'uploaded') {
      updatedRequest.uploadedDate = new Date().toISOString();
    }

    await kv.set(`document:request:${id}`, updatedRequest);

    // Update employee workflow
    if ((body.status === 'verified' || body.status === 'uploaded') && request.status === 'pending') {
      const employee = await kv.get(`employee:${request.employeeId}`);
      if (employee && employee.workflow && employee.workflow.pendingDocumentRequests > 0) {
        employee.workflow.pendingDocumentRequests--;
        await kv.set(`employee:${request.employeeId}`, employee);
      }
    }

    return c.json({ request: updatedRequest });
  } catch (error) {
    console.error("Error updating document request:", error);
    return c.json({ error: "Failed to update document request" }, 500);
  }
});

// Send document reminders (to be called by cron job)
app.post("/make-server-f8517b5b/document-requests/send-reminders", async (c) => {
  try {
    const allRequests = await kv.getByPrefix("document:request:");
    const now = new Date();
    const reminders = [];

    for (const request of (allRequests || [])) {
      if (request.status !== 'pending' && request.status !== 'overdue') {
        continue;
      }

      const requestedDate = new Date(request.requestedDate);
      const dueDate = new Date(request.dueDate);
      const daysSinceRequest = Math.floor((now.getTime() - requestedDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminder every 3 days, or if overdue
      const shouldSendReminder = 
        (daysSinceRequest % 3 === 0 && daysSinceRequest > 0) || 
        (daysUntilDue < 0);

      if (shouldSendReminder) {
        reminders.push({
          employeeId: request.employeeId,
          employeeName: request.employeeName,
          employeeEmail: request.employeeEmail,
          documentType: request.documentType,
          dueDate: request.dueDate,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
          reminderCount: request.remindersSent,
        });
      }
    }

    return c.json({ 
      remindersSent: reminders.length,
      reminders,
      message: `Sent ${reminders.length} document reminders`
    });
  } catch (error) {
    console.error("Error sending document reminders:", error);
    return c.json({ error: "Failed to send document reminders" }, 500);
  }
});

// ============================================
// LEAVE/PTO MANAGEMENT ENDPOINTS
// ============================================

// Get all leave requests
app.get("/make-server-f8517b5b/leave-requests", async (c) => {
  try {
    const requests = await kv.getByPrefix("leave-request:");
    return c.json({ leaveRequests: requests || [] });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return c.json({ error: "Failed to fetch leave requests" }, 500);
  }
});

// Create leave request
app.post("/make-server-f8517b5b/leave-requests", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const request = {
      id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      leaveType: body.leaveType,
      startDate: body.startDate,
      endDate: body.endDate,
      totalDays: body.totalDays,
      reason: body.reason,
      status: body.status || "pending",
      requestedDate: now,
      notes: body.notes || "",
    };

    await kv.set(`leave-request:${id}`, request);
    return c.json({ leaveRequest: request }, 201);
  } catch (error) {
    console.error("Error creating leave request:", error);
    return c.json({ error: "Failed to create leave request" }, 500);
  }
});

// ============================================
// PROJECT ASSIGNMENTS ENDPOINTS
// ============================================

// Get all project assignments
app.get("/make-server-f8517b5b/project-assignments", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    let assignments = await kv.get("project_assignments") || [];
    
    // Filter by employeeId if provided
    if (employeeId) {
      assignments = assignments.filter((a: any) => a.employeeId === employeeId);
    }
    
    return c.json({ assignments });
  } catch (error) {
    console.error("Error fetching project assignments:", error);
    return c.json({ error: "Failed to fetch project assignments" }, 500);
  }
});

// Create new project assignment
app.post("/make-server-f8517b5b/project-assignments", async (c) => {
  try {
    const body = await c.req.json();
    const assignments = await kv.get("project_assignments") || [];
    
    const newAssignment = {
      ...body,
      id: crypto.randomUUID(),
      vendorId: body.vendorId || '',
      vendorName: body.vendorName || '',
      createdAt: new Date().toISOString()
    };
    
    assignments.push(newAssignment);
    await kv.set("project_assignments", assignments);
    
    console.log(`Project assignment created: ${newAssignment.id} - ${newAssignment.projectName}`);
    
    return c.json({ assignment: newAssignment }, 201);
  } catch (error) {
    console.error("Error creating project assignment:", error);
    return c.json({ error: "Failed to create project assignment" }, 500);
  }
});

// Update project assignment
app.put("/make-server-f8517b5b/project-assignments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const assignments = await kv.get("project_assignments") || [];
    
    const index = assignments.findIndex((a: any) => a.id === id);
    if (index === -1) {
      return c.json({ error: "Project assignment not found" }, 404);
    }
    
    assignments[index] = { ...assignments[index], ...body, id };
    await kv.set("project_assignments", assignments);
    
    return c.json({ assignment: assignments[index] });
  } catch (error) {
    console.error("Error updating project assignment:", error);
    return c.json({ error: "Failed to update project assignment" }, 500);
  }
});

// Delete project assignment
app.delete("/make-server-f8517b5b/project-assignments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    let assignments = await kv.get("project_assignments") || [];
    
    assignments = assignments.filter((a: any) => a.id !== id);
    await kv.set("project_assignments", assignments);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting project assignment:", error);
    return c.json({ error: "Failed to delete project assignment" }, 500);
  }
});

// Auto-fix missing project assignments
app.post("/make-server-f8517b5b/project-assignments/auto-fix", async (c) => {
  try {
    console.log('[Auto-Fix] Starting auto-fix for missing project assignments...');
    
    // Get all approved timesheets
    const timesheets = await kv.getByPrefix("timesheet:");
    const approvedTimesheets = timesheets.filter((ts: any) => ts.status === "approved");
    
    // Get existing assignments
    const existingAssignments = await kv.get("project_assignments") || [];
    
    console.log(`[Auto-Fix] Found ${approvedTimesheets.length} approved timesheets`);
    console.log(`[Auto-Fix] Found ${existingAssignments.length} existing assignments`);
    
    const newAssignments: any[] = [];
    const missingRates: any[] = [];
    
    // Check each approved timesheet for missing assignment
    for (const ts of approvedTimesheets) {
      const projectName = ts.projectName || ts.project;
      if (!projectName || !ts.employeeId) continue;
      
      // Check if assignment exists
      const assignmentExists = existingAssignments.some((a: any) => 
        a.employeeId === ts.employeeId && 
        (a.projectName === projectName || 
         a.projectName?.toLowerCase() === projectName?.toLowerCase())
      );
      
      if (!assignmentExists) {
        // Check if we already plan to create this assignment
        const alreadyPlanned = newAssignments.some((a: any) => 
          a.employeeId === ts.employeeId && a.projectName === projectName
        );
        
        if (!alreadyPlanned) {
          console.log(`[Auto-Fix] Missing assignment: ${ts.employeeName} -> ${projectName}`);
          
          newAssignments.push({
            id: crypto.randomUUID(),
            employeeId: ts.employeeId,
            employeeName: ts.employeeName,
            clientId: ts.clientId || '',
            clientName: ts.clientName || ts.client || '',
            projectName: projectName,
            projectId: ts.projectId || crypto.randomUUID(),
            billableRate: 0,
            status: 'active',
            startDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            autoCreated: true,
            needsRateUpdate: true,
          });
          
          missingRates.push({
            employeeId: ts.employeeId,
            employeeName: ts.employeeName,
            projectName: projectName,
            clientName: ts.clientName || ts.client,
          });
        }
      }
    }
    
    if (newAssignments.length > 0) {
      // Add new assignments to existing ones
      const updatedAssignments = [...existingAssignments, ...newAssignments];
      await kv.set("project_assignments", updatedAssignments);
      
      console.log(`[Auto-Fix] ✅ Created ${newAssignments.length} new project assignments`);
      
      return c.json({
        created: newAssignments.length,
        assignments: newAssignments,
        missingRates: missingRates,
        message: `Created ${newAssignments.length} project assignment(s). Please set billing rates.`
      });
    } else {
      console.log('[Auto-Fix] ✅ All timesheets have project assignments');
      return c.json({
        created: 0,
        message: 'All timesheets already have project assignments'
      });
    }
  } catch (error) {
    console.error("Error auto-fixing project assignments:", error);
    return c.json({ error: "Failed to auto-fix project assignments", details: String(error) }, 500);
  }
});

// ============================================
// CLIENT MANAGEMENT ENDPOINTS
// ============================================

// Get all clients (basic endpoint for dropdowns/lists)
app.get("/make-server-f8517b5b/clients", async (c) => {
  try {
    console.log("Fetching clients (basic) with kv.getByPrefix...");
    const clients = await kv.getByPrefix("client:");
    console.log(`Found ${clients?.length || 0} clients`);
    return c.json({ clients: clients || [] });
  } catch (error) {
    console.error("Error fetching clients (basic) - Full error:", error);
    return c.json({ 
      error: "Failed to fetch clients", 
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all clients (enhanced)
app.get("/make-server-f8517b5b/clients-enhanced", async (c) => {
  try {
    console.log("Fetching clients (enhanced) with kv.getByPrefix...");
    const clients = await kv.getByPrefix("client:");
    console.log(`Found ${clients?.length || 0} clients`);
    return c.json({ clients: clients || [] });
  } catch (error) {
    console.error("Error fetching clients (enhanced) - Full error:", error);
    return c.json({ 
      error: "Failed to fetch clients", 
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all clients (advanced) - MUST BE BEFORE /:id route
app.get("/make-server-f8517b5b/clients/advanced", async (c) => {
  try {
    console.log("Fetching clients with kv.getByPrefix...");
    const clients = await kv.getByPrefix("client:advanced:");
    
    // Also fetch all documents to attach them to clients
    const documents = await kv.getByPrefix("client:document:");
    
    // Attach documents to clients
    const clientsWithDocuments = clients.map((client: any) => {
      const clientDocs = documents.filter((doc: any) => doc.clientId === client.id);
      return {
        ...client,
        documents: clientDocs
      };
    });
    
    console.log(`Found ${clients?.length || 0} advanced clients with ${documents?.length || 0} documents total`);
    return c.json({ clients: clientsWithDocuments || [] });
  } catch (error) {
    console.error("Error fetching clients - Full error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    return c.json({ 
      error: "Failed to fetch clients", 
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get single advanced client by ID
app.get("/make-server-f8517b5b/clients/advanced/:id", async (c) => {
  try {
    const id = c.req.param("id");
    console.log(`Fetching advanced client with ID: ${id}`);
    
    // Try both with and without 'advanced:' prefix
    let client = await kv.get(`client:advanced:${id}`);
    if (!client) {
      client = await kv.get(`client:${id}`);
    }
    
    if (!client) {
      console.log(`Client not found with ID: ${id}`);
      return c.json({ error: "Client not found" }, 404);
    }
    
    console.log(`Found client: ${client.companyName}`);
    return c.json({ client });
  } catch (error) {
    console.error("Error fetching advanced client:", error);
    return c.json({ error: "Failed to fetch client", details: String(error) }, 500);
  }
});

// Get single client - MUST BE AFTER specific routes like /advanced
app.get("/make-server-f8517b5b/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const client = await kv.get(`client:${id}`);
    
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    return c.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return c.json({ error: "Failed to fetch client", details: String(error) }, 500);
  }
});

// Update advanced client
app.put("/make-server-f8517b5b/clients/advanced/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingClient = await kv.get(`client:advanced:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    const now = new Date().toISOString();

    // Update contacts with IDs if they don't have them
    const contacts = (body.contacts || []).map((contact: any) => ({
      ...contact,
      id: contact.id || crypto.randomUUID(),
      clientId: id,
      updatedAt: now,
      createdAt: contact.createdAt || now,
    }));

    const updatedClient = {
      ...existingClient,
      ...body,
      contacts,
      id, // Ensure ID doesn't change
      createdAt: existingClient.createdAt, // Preserve creation date
      updatedAt: now,
    };

    await kv.set(`client:advanced:${id}`, updatedClient);

    return c.json({ client: updatedClient });
  } catch (error) {
    console.error("Error updating advanced client:", error);
    return c.json({ 
      error: "Failed to update client", 
      details: String(error) 
    }, 500);
  }
});

// Archive advanced client
app.post("/make-server-f8517b5b/clients/advanced/:id/archive", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingClient = await kv.get(`client:advanced:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    const now = new Date().toISOString();

    const updatedClient = {
      ...existingClient,
      isActive: false,
      status: 'archived',
      archivedAt: now,
      updatedAt: now,
    };

    await kv.set(`client:advanced:${id}`, updatedClient);

    return c.json({ client: updatedClient, message: "Client archived successfully" });
  } catch (error) {
    console.error("Error archiving advanced client:", error);
    return c.json({ 
      error: "Failed to archive client", 
      details: String(error) 
    }, 500);
  }
});

// Unarchive advanced client
app.post("/make-server-f8517b5b/clients/advanced/:id/unarchive", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingClient = await kv.get(`client:advanced:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    const now = new Date().toISOString();

    const updatedClient = {
      ...existingClient,
      isActive: true,
      status: 'active',
      archivedAt: undefined,
      updatedAt: now,
    };

    await kv.set(`client:advanced:${id}`, updatedClient);

    return c.json({ client: updatedClient, message: "Client unarchived successfully" });
  } catch (error) {
    console.error("Error unarchiving advanced client:", error);
    return c.json({ 
      error: "Failed to unarchive client", 
      details: String(error) 
    }, 500);
  }
});

// Delete advanced client
app.delete("/make-server-f8517b5b/clients/advanced/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const client = await kv.get(`client:advanced:${id}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    // Check for associated data
    const warnings = [];
    
    if (client.engagements && client.engagements.length > 0) {
      warnings.push(`${client.engagements.length} engagement(s)`);
    }
    
    if (client.purchaseOrders && client.purchaseOrders.length > 0) {
      warnings.push(`${client.purchaseOrders.length} purchase order(s)`);
    }
    
    if (client.documents && client.documents.length > 0) {
      warnings.push(`${client.documents.length} document(s)`);
    }
    
    if (client.contacts && client.contacts.length > 0) {
      warnings.push(`${client.contacts.length} contact(s)`);
    }

    await kv.del(`client:advanced:${id}`);

    return c.json({ 
      success: true, 
      message: "Client deleted successfully",
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    console.error("Error deleting advanced client:", error);
    return c.json({ error: "Failed to delete client", details: String(error) }, 500);
  }
});

// Check if client exists (Req 4.1 - Existing Client Check)
app.get("/make-server-f8517b5b/clients/check-existing", async (c) => {
  try {
    const taxId = c.req.query("taxId");
    const companyName = c.req.query("companyName");

    if (!taxId && !companyName) {
      return c.json({ error: "Tax ID or company name required" }, 400);
    }

    const allClients = await kv.getByPrefix("client:advanced:");
    
    const matchingClient = (allClients || []).find((client: any) => {
      if (taxId && client.taxId === taxId) return true;
      if (companyName && client.companyName.toLowerCase() === companyName.toLowerCase()) return true;
      return false;
    });

    return c.json({
      exists: !!matchingClient,
      client: matchingClient || null,
      requiresFullOnboarding: !matchingClient,
      message: matchingClient 
        ? "Existing client found. Skip MSA, add PO only." 
        : "New client. Full onboarding required: MSA + PO + compliance docs.",
    });
  } catch (error) {
    console.error("Error checking existing client:", error);
    return c.json({ 
      error: "Failed to check client", 
      details: String(error) 
    }, 500);
  }
});

// Add engagement to client
app.post("/make-server-f8517b5b/clients/:id/engagements", async (c) => {
  try {
    const clientId = c.req.param("id");
    const body = await c.req.json();

    const client = await kv.get(`client:advanced:${clientId}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const engagementId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newEngagement = {
      id: engagementId,
      clientId,
      engagementName: body.engagementName,
      engagementType: body.engagementType || 'Consulting',
      status: body.status || 'Negotiation',
      startDate: body.startDate || now,
      endDate: body.endDate,
      purchaseOrders: [],
      activePOCount: 0,
      totalPOValue: 0,
      totalPOSpent: 0,
      totalPORemaining: 0,
      createdBy: body.createdBy || 'system',
      createdAt: now,
    };

    const updatedClient = {
      ...client,
      engagements: [...(client.engagements || []), newEngagement],
      activeEngagements: (client.activeEngagements || 0) + 1,
      updatedAt: now,
    };

    await kv.set(`client:advanced:${clientId}`, updatedClient);

    return c.json({ engagement: newEngagement, client: updatedClient }, 201);
  } catch (error) {
    console.error("Error adding engagement:", error);
    return c.json({ error: "Failed to add engagement", details: String(error) }, 500);
  }
});

// Add PO to engagement
app.post("/make-server-f8517b5b/clients/:clientId/engagements/:engagementId/pos", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const engagementId = c.req.param("engagementId");
    const body = await c.req.json();

    const client = await kv.get(`client:advanced:${clientId}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const engagementIndex = (client.engagements || []).findIndex(
      (e: any) => e.id === engagementId
    );

    if (engagementIndex === -1) {
      return c.json({ error: "Engagement not found" }, 404);
    }

    const poId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newPO = {
      id: poId,
      clientId,
      engagementId,
      poNumber: body.poNumber,
      poType: body.poType || 'Initial',
      startDate: body.startDate,
      endDate: body.endDate,
      totalAmount: body.totalAmount || 0,
      spentAmount: 0,
      remainingAmount: body.totalAmount || 0,
      currency: body.currency || 'USD',
      status: 'Active',
      isValid: true,
      validationErrors: [],
      expiryWarning: false,
      budgetWarning: false,
      createdBy: body.createdBy || 'system',
      createdAt: now,
    };

    // Validate PO dates
    if (new Date(newPO.endDate) <= new Date(newPO.startDate)) {
      newPO.isValid = false;
      newPO.validationErrors = ['End date must be after start date'];
    }

    // Check for expiry warning (within 30 days)
    const daysUntilExpiry = Math.floor(
      (new Date(newPO.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      newPO.expiryWarning = true;
    }

    const engagement = client.engagements[engagementIndex];
    engagement.purchaseOrders = [...(engagement.purchaseOrders || []), newPO];
    engagement.activePOCount = (engagement.activePOCount || 0) + 1;
    engagement.totalPOValue = (engagement.totalPOValue || 0) + newPO.totalAmount;
    engagement.totalPORemaining = (engagement.totalPORemaining || 0) + newPO.remainingAmount;

    client.engagements[engagementIndex] = engagement;
    client.updatedAt = now;

    await kv.set(`client:advanced:${clientId}`, client);

    return c.json({ po: newPO, client }, 201);
  } catch (error) {
    console.error("Error adding PO:", error);
    return c.json({ error: "Failed to add PO", details: String(error) }, 500);
  }
});

// Get client documents
app.get("/make-server-f8517b5b/clients/:id/documents", async (c) => {
  try {
    const clientId = c.req.param("id");
    console.log(`Fetching documents for client: ${clientId}`);
    
    // Get all client documents from KV store
    const allDocuments = await kv.getByPrefix("client:document:");
    const clientDocuments = (allDocuments || []).filter((doc: any) => doc.clientId === clientId);
    
    console.log(`Found ${clientDocuments.length} documents for client ${clientId}`);
    return c.json({ documents: clientDocuments });
  } catch (error) {
    console.error("Error fetching client documents:", error);
    return c.json({ error: "Failed to fetch client documents", details: String(error) }, 500);
  }
});

// Document upload implementation (Req 4.2)
app.post("/make-server-f8517b5b/clients/:id/documents/upload", async (c) => {
  try {
    const clientId = c.req.param("id");
    console.log(`[Client Docs] Upload request for client: ${clientId}`);
    
    // Parse form data
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string;
    
    if (!file || !documentType) {
      return c.json({ error: "Missing file or documentType" }, 400);
    }

    // Verify client exists
    const client = await kv.get(`client:advanced:${clientId}`) || await kv.get(`client:${clientId}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const documentId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Initialize Supabase client for storage
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create bucket if it doesn't exist
    const bucketName = 'make-f8517b5b-client-documents';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      if (createError) {
        console.error("Error creating bucket:", createError);
        // Continue anyway, maybe it was created concurrently
      }
    }

    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Upload file to storage
    const filePath = `${clientId}/${documentId}/${file.name}`;
    console.log(`Uploading to path: ${filePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
      });
    
    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return c.json({ error: "Failed to upload file", details: String(uploadError) }, 500);
    }

    // Create document metadata
    const document = {
      id: documentId,
      clientId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: now,
      uploadedBy: "Admin", // Default to Admin for now
      status: "approved",
      filePath,
      storageBucket: bucketName,
      fileUploaded: true,
      verificationStatus: "verified"
    };

    console.log("Saving document metadata:", { id: documentId, clientId });
    await kv.set(`client:document:${documentId}`, document);

    return c.json({ 
      success: true, 
      document,
      message: `${documentType} uploaded successfully` 
    }, 201);
  } catch (error) {
    console.error("Error in document upload:", error);
    return c.json({ error: "Failed to upload document", details: String(error) }, 500);
  }
});

// Delete client document
app.delete("/make-server-f8517b5b/clients/:clientId/documents/:documentId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const documentId = c.req.param("documentId");
    
    console.log(`Deleting document ${documentId} for client ${clientId}`);
    
    // Check if document exists
    const document = await kv.get(`client:document:${documentId}`);
    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }
    
    // Verify document belongs to this client
    if (document.clientId !== clientId) {
      return c.json({ error: "Document does not belong to this client" }, 403);
    }
    
    // Delete the document
    await kv.del(`client:document:${documentId}`);
    
    console.log(`Successfully deleted document ${documentId}`);
    return c.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting client document:", error);
    return c.json({ error: "Failed to delete document", details: String(error) }, 500);
  }
});

// ============================================
// DOCUMENT REQUEST ENDPOINTS (Req 3.3)
// ============================================

// Get document requests for an employee
app.get("/make-server-f8517b5b/document-requests", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    const allRequests = await kv.getByPrefix("document:request:");
    
    let requests = allRequests || [];
    if (employeeId) {
      requests = requests.filter((r: any) => r.employeeId === employeeId);
    }

    // Update overdue status
    const now = new Date();
    for (const request of requests) {
      if (request.status === 'pending' && new Date(request.dueDate) < now) {
        request.status = 'overdue';
        await kv.set(`document:request:${request.id}`, request);
      }
    }

    return c.json({ requests });
  } catch (error) {
    console.error("Error fetching document requests:", error);
    return c.json({ error: "Failed to fetch document requests" }, 500);
  }
});

// Auto-create mandatory document requests for new employee
app.post("/make-server-f8517b5b/document-requests/auto-create", async (c) => {
  try {
    const body = await c.req.json();
    const { employeeId, employeeName, employeeEmail, startDate } = body;

    if (!employeeId || !employeeName || !employeeEmail) {
      return c.text("Missing required fields: employeeId, employeeName, employeeEmail", 400);
    }

    const now = new Date();
    const dueDate = startDate ? new Date(startDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now or start date

    const mandatoryDocuments = [
      { type: 'Government-issued ID', notes: 'Please upload a clear copy of your government-issued ID (Driver\'s License, State ID, or Passport)' },
      { type: 'Address Proof', notes: 'Upload a recent utility bill, lease agreement, or bank statement showing your current address' },
      { type: 'Work Authorization', notes: 'Upload proof of work authorization (EAD, Visa, Green Card, or I-94)' },
      { type: 'Direct Deposit Form', notes: 'Complete and upload the direct deposit authorization form for payroll' },
      { type: 'Emergency Contact', notes: 'Provide emergency contact information' },
      { type: 'I-9', notes: 'Complete Section 1 of Form I-9' },
      { type: 'W-4', notes: 'Complete and submit your W-4 form for tax withholding' },
    ];

    const createdRequests = [];
    let pendingCount = 0;

    for (const doc of mandatoryDocuments) {
      const id = crypto.randomUUID();
      const request = {
        id,
        employeeId,
        employeeName,
        employeeEmail,
        documentType: doc.type,
        requestedBy: "System (Auto-created)",
        requestedDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        status: "pending",
        priority: "high",
        remindersSent: 0,
        notes: doc.notes,
        mandatory: true,
        blocksOnboarding: true,
      };

      await kv.set(`document:request:${id}`, request);
      createdRequests.push(request);
      pendingCount++;
    }

    // Update employee workflow with pending document count
    const employee = await kv.get(`employee:${employeeId}`);
    if (employee && employee.workflow) {
      employee.workflow.pendingDocumentRequests = pendingCount;
      await kv.set(`employee:${employeeId}`, employee);
    }

    return c.json({ 
      message: `Created ${createdRequests.length} mandatory document requests`,
      requests: createdRequests,
      pendingCount
    }, 201);
  } catch (error) {
    console.error("Error auto-creating document requests:", error);
    return c.json({ error: "Failed to auto-create document requests" }, 500);
  }
});

// Create document request
app.post("/make-server-f8517b5b/document-requests", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const request = {
      id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      employeeEmail: body.employeeEmail,
      documentType: body.documentType,
      requestedBy: body.requestedBy || "System",
      requestedDate: now,
      dueDate: body.dueDate,
      status: "pending",
      priority: body.priority || "medium",
      remindersSent: 0,
      notes: body.notes || "",
      mandatory: body.mandatory !== false,
      blocksOnboarding: body.blocksOnboarding !== false,
    };

    await kv.set(`document:request:${id}`, request);

    // Update employee workflow
    const employee = await kv.get(`employee:${body.employeeId}`);
    if (employee && employee.workflow) {
      employee.workflow.pendingDocumentRequests = (employee.workflow.pendingDocumentRequests || 0) + 1;
      await kv.set(`employee:${body.employeeId}`, employee);
    }

    return c.json({ request }, 201);
  } catch (error) {
    console.error("Error creating document request:", error);
    return c.json({ error: "Failed to create document request" }, 500);
  }
});

// Update document request (e.g., mark as uploaded)
app.put("/make-server-f8517b5b/document-requests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const request = await kv.get(`document:request:${id}`);
    if (!request) {
      return c.text("Document request not found", 404);
    }

    const updatedRequest = {
      ...request,
      ...body,
    };

    if (body.status === 'uploaded' && !request.uploadedDate) {
      updatedRequest.uploadedDate = new Date().toISOString();
    }

    await kv.set(`document:request:${id}`, updatedRequest);

    // Update employee workflow
    if ((body.status === 'verified' || body.status === 'uploaded') && request.status === 'pending') {
      const employee = await kv.get(`employee:${request.employeeId}`);
      if (employee && employee.workflow && employee.workflow.pendingDocumentRequests > 0) {
        employee.workflow.pendingDocumentRequests--;
        await kv.set(`employee:${request.employeeId}`, employee);
      }
    }

    return c.json({ request: updatedRequest });
  } catch (error) {
    console.error("Error updating document request:", error);
    return c.json({ error: "Failed to update document request" }, 500);
  }
});

// Send document reminders (to be called by cron job)
app.post("/make-server-f8517b5b/document-requests/send-reminders", async (c) => {
  try {
    const allRequests = await kv.getByPrefix("document:request:");
    const now = new Date();
    const reminders = [];

    for (const request of (allRequests || [])) {
      if (request.status !== 'pending' && request.status !== 'overdue') {
        continue;
      }

      const requestedDate = new Date(request.requestedDate);
      const dueDate = new Date(request.dueDate);
      const daysSinceRequest = Math.floor((now.getTime() - requestedDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminder every 3 days, or if overdue
      const shouldSendReminder = 
        (daysSinceRequest % 3 === 0 && daysSinceRequest > 0) ||
        (daysUntilDue <= 2 && daysUntilDue >= 0) ||
        (daysUntilDue < 0);

      if (shouldSendReminder) {
        request.remindersSent = (request.remindersSent || 0) + 1;
        request.lastReminderDate = now.toISOString();
        
        if (daysUntilDue < 0) {
          request.status = 'overdue';
        }

        await kv.set(`document:request:${request.id}`, request);

        reminders.push({
          requestId: request.id,
          employeeEmail: request.employeeEmail,
          employeeName: request.employeeName,
          documentType: request.documentType,
          dueDate: request.dueDate,
          isOverdue: daysUntilDue < 0,
          reminderCount: request.remindersSent,
        });
      }
    }

    return c.json({ 
      remindersSent: reminders.length,
      reminders,
      message: `Sent ${reminders.length} document reminders`
    });
  } catch (error) {
    console.error("Error sending document reminders:", error);
    return c.json({ error: "Failed to send document reminders" }, 500);
  }
});

// ============================================
// LEAVE/PTO MANAGEMENT ENDPOINTS
// ============================================

// Get all leave requests
app.get("/make-server-f8517b5b/leave-requests", async (c) => {
  try {
    const requests = await kv.getByPrefix("leave-request:");
    return c.json({ leaveRequests: requests || [] });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return c.json({ error: "Failed to fetch leave requests" }, 500);
  }
});

// Create leave request
app.post("/make-server-f8517b5b/leave-requests", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const request = {
      id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      leaveType: body.leaveType,
      startDate: body.startDate,
      endDate: body.endDate,
      totalDays: body.totalDays,
      reason: body.reason,
      status: body.status || "pending",
      requestedDate: now,
      notes: body.notes || "",
    };

    await kv.set(`leave-request:${id}`, request);
    return c.json({ leaveRequest: request }, 201);
  } catch (error) {
    console.error("Error creating leave request:", error);
    return c.json({ error: "Failed to create leave request" }, 500);
  }
});

// Approve leave request
app.put("/make-server-f8517b5b/leave-requests/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const request = await kv.get(`leave-request:${id}`);
    if (!request) {
      return c.json({ error: "Leave request not found" }, 404);
    }

    const updatedRequest = {
      ...request,
      status: "approved",
      approvedBy: body.approvedBy || "Manager",
      approvedDate: body.approvedDate,
    };

    await kv.set(`leave-request:${id}`, updatedRequest);
    return c.json({ leaveRequest: updatedRequest });
  } catch (error) {
    console.error("Error approving leave request:", error);
    return c.json({ error: "Failed to approve leave request" }, 500);
  }
});

// Reject leave request
app.put("/make-server-f8517b5b/leave-requests/:id/reject", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const request = await kv.get(`leave-request:${id}`);
    if (!request) {
      return c.json({ error: "Leave request not found" }, 404);
    }

    const updatedRequest = {
      ...request,
      status: "rejected",
      rejectionReason: body.rejectionReason,
    };

    await kv.set(`leave-request:${id}`, updatedRequest);
    return c.json({ leaveRequest: updatedRequest });
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    return c.json({ error: "Failed to reject leave request" }, 500);
  }
});

// Get PTO balances
app.get("/make-server-f8517b5b/pto-balances", async (c) => {
  try {
    const balances = await kv.getByPrefix("pto-balance:");
    return c.json({ balances: balances || [] });
  } catch (error) {
    console.error("Error fetching PTO balances:", error);
    return c.json({ error: "Failed to fetch PTO balances" }, 500);
  }
});

// ============================================
// OFFBOARDING ENDPOINTS
// ============================================

// Get all offboarding records
app.get("/make-server-f8517b5b/offboarding", async (c) => {
  try {
    const records = await kv.getByPrefix("offboarding:");
    return c.json({ offboardingRecords: records || [] });
  } catch (error) {
    console.error("Error fetching offboarding records:", error);
    return c.json({ error: "Failed to fetch offboarding records" }, 500);
  }
});

// Create offboarding record
app.post("/make-server-f8517b5b/offboarding", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      department: body.department,
      position: body.position,
      lastWorkingDate: body.lastWorkingDate,
      offboardingReason: body.offboardingReason,
      reasonDetails: body.reasonDetails || "",
      status: "initiated",
      initiatedBy: body.initiatedBy,
      initiatedDate: now,
      exitInterviewScheduled: false,
      tasks: body.tasks || [],
      assetsToReturn: body.assetsToReturn || [],
      systemAccessRevoked: false,
      badgeReturned: false,
      keysReturned: false,
      hrApproval: false,
      managerApproval: false,
      itApproval: false,
      finalPaycheckProcessed: false,
      unusedPTOPaid: false,
      notes: body.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`offboarding:${id}`, record);
    return c.json({ offboardingRecord: record }, 201);
  } catch (error) {
    console.error("Error creating offboarding record:", error);
    return c.json({ error: "Failed to create offboarding record" }, 500);
  }
});

// Update offboarding record
app.put("/make-server-f8517b5b/offboarding/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const record = await kv.get(`offboarding:${id}`);
    if (!record) {
      return c.json({ error: "Offboarding record not found" }, 404);
    }

    const updatedRecord = {
      ...record,
      ...body,
      id,
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`offboarding:${id}`, updatedRecord);
    return c.json({ offboardingRecord: updatedRecord });
  } catch (error) {
    console.error("Error updating offboarding record:", error);
    return c.json({ error: "Failed to update offboarding record" }, 500);
  }
});

// Delete offboarding record
app.delete("/make-server-f8517b5b/offboarding/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const record = await kv.get(`offboarding:${id}`);
    if (!record) {
      return c.json({ error: "Offboarding record not found" }, 404);
    }

    await kv.del(`offboarding:${id}`);
    return c.json({ message: "Offboarding record deleted successfully" });
  } catch (error) {
    console.error("Error deleting offboarding record:", error);
    return c.json({ error: "Failed to delete offboarding record" }, 500);
  }
});

// ============================================
// PERFORMANCE MANAGEMENT ENDPOINTS
// ============================================

// Get all performance reviews
app.get("/make-server-f8517b5b/performance-reviews", async (c) => {
  try {
    const reviews = await kv.getByPrefix("performance-review:");
    return c.json({ performanceReviews: reviews || [] });
  } catch (error) {
    console.error("Error fetching performance reviews:", error);
    return c.json({ error: "Failed to fetch performance reviews" }, 500);
  }
});

// Create performance review
app.post("/make-server-f8517b5b/performance-reviews", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const review = {
      id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      reviewerId: body.reviewerId,
      reviewerName: body.reviewerName,
      reviewCycle: body.reviewCycle,
      reviewPeriodStart: body.reviewPeriodStart,
      reviewPeriodEnd: body.reviewPeriodEnd,
      reviewDate: body.reviewDate,
      overallRating: body.overallRating,
      technicalSkills: body.technicalSkills,
      communication: body.communication,
      teamwork: body.teamwork,
      productivity: body.productivity,
      initiative: body.initiative,
      reliability: body.reliability,
      strengths: body.strengths || "",
      areasForImprovement: body.areasForImprovement || "",
      accomplishments: body.accomplishments || "",
      managerComments: body.managerComments || "",
      employeeComments: body.employeeComments || "",
      goalsLastPeriod: body.goalsLastPeriod || [],
      goalsNextPeriod: body.goalsNextPeriod || [],
      promotionRecommended: body.promotionRecommended || false,
      salaryIncreaseRecommended: body.salaryIncreaseRecommended || false,
      salaryIncreasePercentage: body.salaryIncreasePercentage || 0,
      trainingRecommended: body.trainingRecommended || false,
      trainingAreas: body.trainingAreas || "",
      pipRequired: body.pipRequired || false,
      reviewerSigned: false,
      employeeSigned: false,
      hrReviewed: false,
      status: "draft",
      notes: body.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`performance-review:${id}`, review);
    return c.json({ performanceReview: review }, 201);
  } catch (error) {
    console.error("Error creating performance review:", error);
    return c.json({ error: "Failed to create performance review" }, 500);
  }
});

// Update performance review
app.put("/make-server-f8517b5b/performance-reviews/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const review = await kv.get(`performance-review:${id}`);
    if (!review) {
      return c.json({ error: "Performance review not found" }, 404);
    }

    const updatedReview = {
      ...review,
      ...body,
      id,
      createdAt: review.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`performance-review:${id}`, updatedReview);
    return c.json({ performanceReview: updatedReview });
  } catch (error) {
    console.error("Error updating performance review:", error);
    return c.json({ error: "Failed to update performance review" }, 500);
  }
});

// ============================================
// BUSINESS LICENSING ENDPOINTS
// ============================================

// Get all business licenses (legacy endpoint - returns wrapped object)
app.get("/make-server-f8517b5b/business-licenses", async (c) => {
  try {
    const licenses = await kv.getByPrefix("business-license:");
    return c.json({ licenses: licenses || [] });
  } catch (error) {
    console.error("Error fetching business licenses:", error);
    return c.json({ error: "Failed to fetch business licenses" }, 500);
  }
});

// Get all business licenses (new endpoint - returns array directly)
app.get("/make-server-f8517b5b/licenses", async (c) => {
  try {
    const licenses = await kv.getByPrefix("business-license:");
    return c.json(Array.isArray(licenses) ? licenses : []);
  } catch (error) {
    console.error("Error fetching business licenses:", error);
    return c.json({ error: "Failed to fetch business licenses" }, 500);
  }
});

// Create business license
app.post("/make-server-f8517b5b/business-licenses", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const license = {
      id,
      licenseName: body.licenseName,
      licenseType: body.licenseType,
      licenseNumber: body.licenseNumber,
      jurisdictionLevel: body.jurisdictionLevel,
      jurisdiction: body.jurisdiction,
      issuingAuthority: body.issuingAuthority,
      issueDate: body.issueDate,
      expiryDate: body.expiryDate,
      renewalDate: body.renewalDate || null,
      status: body.status || 'active',
      complianceType: body.complianceType,
      relatedTo: body.relatedTo,
      linkedStates: body.linkedStates || [],
      linkedCounties: body.linkedCounties || [],
      linkedCities: body.linkedCities || [],
      linkedEmployees: body.linkedEmployees || [],
      linkedClients: body.linkedClients || [],
      fee: body.fee || 0,
      renewalFee: body.renewalFee || 0,
      documentUrl: body.documentUrl || null,
      notes: body.notes || "",
      requiresAction: body.requiresAction || false,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`business-license:${id}`, license);
    return c.json({ license }, 201);
  } catch (error) {
    console.error("Error creating business license:", error);
    return c.json({ error: "Failed to create business license" }, 500);
  }
});

// Create license (new endpoint - returns license directly)
app.post("/make-server-f8517b5b/licenses", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const license = {
      ...body,
      id,
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    await kv.set(`business-license:${id}`, license);
    return c.json(license, 201);
  } catch (error) {
    console.error("Error creating license:", error);
    return c.json({ error: "Failed to create license" }, 500);
  }
});

// Update business license
app.put("/make-server-f8517b5b/business-licenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const license = await kv.get(`business-license:${id}`);
    if (!license) {
      return c.json({ error: "License not found" }, 404);
    }

    const updatedLicense = {
      ...license,
      ...body,
      id,
      createdAt: license.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`business-license:${id}`, updatedLicense);
    return c.json({ license: updatedLicense });
  } catch (error) {
    console.error("Error updating business license:", error);
    return c.json({ error: "Failed to update business license" }, 500);
  }
});

// Update license (new endpoint - returns license directly)
app.put("/make-server-f8517b5b/licenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const license = await kv.get(`business-license:${id}`);
    if (!license) {
      return c.json({ error: "License not found" }, 404);
    }

    const updatedLicense = {
      ...license,
      ...body,
      id,
      createdAt: license.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`business-license:${id}`, updatedLicense);
    return c.json(updatedLicense);
  } catch (error) {
    console.error("Error updating license:", error);
    return c.json({ error: "Failed to update license" }, 500);
  }
});

// Delete business license
app.delete("/make-server-f8517b5b/business-licenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    console.log(`Attempting to delete business license with ID: ${id}`);
    
    const license = await kv.get(`business-license:${id}`);
    if (!license) {
      console.log(`License not found: ${id}`);
      return c.json({ error: "License not found" }, 404);
    }

    console.log(`Found license: ${license.licenseName}`);

    // Delete the main license record
    await kv.del(`business-license:${id}`);
    console.log(`Deleted license record: ${id}`);

    // Also delete related renewal tasks
    const allTasks = await kv.getByPrefix("renewal-task:");
    const relatedTasks = (allTasks || []).filter((task: any) => task.licenseId === id);
    
    for (const task of relatedTasks) {
      await kv.del(`renewal-task:${task.id}`);
      console.log(`Deleted related renewal task: ${task.id}`);
    }
    
    return c.json({ success: true, message: "License deleted successfully" });
  } catch (error) {
    console.error("Error deleting business license:", error);
    return c.json({ error: "Failed to delete business license" }, 500);
  }
});

// Delete license (new endpoint)
app.delete("/make-server-f8517b5b/licenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const license = await kv.get(`business-license:${id}`);
    if (!license) {
      return c.json({ error: "License not found" }, 404);
    }

    await kv.del(`business-license:${id}`);
    
    // Also delete related renewal tasks
    const allTasks = await kv.getByPrefix("renewal-task:");
    const relatedTasks = (allTasks || []).filter((task: any) => task.licenseId === id);
    
    for (const task of relatedTasks) {
      await kv.del(`renewal-task:${task.id}`);
    }

    // Delete related audit trails
    const allAudits = await kv.getByPrefix("audit-trail:");
    const relatedAudits = (allAudits || []).filter((audit: any) => 
      audit.licenseId === id || (typeof audit === 'string' && audit.includes(`${id}:`))
    );
    
    for (const audit of relatedAudits) {
      const auditKey = `audit-trail:${id}:${audit.id}`;
      await kv.del(auditKey);
      console.log(`Deleted related audit trail: ${auditKey}`);
    }

    // Delete related filings
    const allFilings = await kv.getByPrefix("related-filing:");
    const relatedFilings = (allFilings || []).filter((filing: any) => filing.licenseId === id);
    
    for (const filing of relatedFilings) {
      await kv.del(`related-filing:${filing.id}`);
      console.log(`Deleted related filing: ${filing.id}`);
    }

    console.log(`Successfully deleted license ${id} and all related records`);
    
    return c.json({ 
      success: true,
      message: "License deleted successfully",
      deletedTasks: relatedTasks.length,
      deletedFilings: relatedFilings.length
    });
  } catch (error) {
    console.error("Error deleting business license:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ 
      error: "Failed to delete business license", 
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Upload license document to Supabase Storage
app.post("/make-server-f8517b5b/upload-license-document", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const bucketName = formData.get('bucket') as string || 'make-f8517b5b-license-documents';

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Initialize Supabase client
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760 // 10MB
      });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `licenses/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading file to Supabase Storage:", uploadError);
      return c.json({ error: "Failed to upload file", details: uploadError.message }, 500);
    }

    // Generate signed URL (valid for 10 years for long-term storage)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 315360000); // 10 years in seconds

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return c.json({ error: "Failed to create signed URL", details: signedUrlError.message }, 500);
    }

    return c.json({ 
      url: signedUrlData.signedUrl,
      path: filePath,
      fileName: file.name
    }, 201);
  } catch (error) {
    console.error("Error in upload-license-document endpoint:", error);
    return c.json({ error: "Failed to upload document", details: String(error) }, 500);
  }
});

// Get all license requirements
app.get("/make-server-f8517b5b/license-requirements", async (c) => {
  try {
    const requirements = await kv.getByPrefix("license-requirement:");
    return c.json({ requirements: requirements || [] });
  } catch (error) {
    console.error("Error fetching license requirements:", error);
    return c.json({ error: "Failed to fetch license requirements" }, 500);
  }
});

// Create license requirement
app.post("/make-server-f8517b5b/license-requirements", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    
    const requirement = {
      id,
      jurisdiction: body.jurisdiction,
      jurisdictionLevel: body.jurisdictionLevel,
      requiredLicenseTypes: body.requiredLicenseTypes || [],
      reason: body.reason,
      detectedDate: body.detectedDate || new Date().toISOString(),
      status: body.status || 'pending',
      triggeredBy: body.triggeredBy,
      triggeredById: body.triggeredById,
      triggeredByName: body.triggeredByName,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`license-requirement:${id}`, requirement);
    return c.json({ requirement }, 201);
  } catch (error) {
    console.error("Error creating license requirement:", error);
    return c.json({ error: "Failed to create license requirement" }, 500);
  }
});

// Update license requirement
app.put("/make-server-f8517b5b/license-requirements/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const requirement = await kv.get(`license-requirement:${id}`);
    if (!requirement) {
      return c.json({ error: "Requirement not found" }, 404);
    }

    const updatedRequirement = {
      ...requirement,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`license-requirement:${id}`, updatedRequirement);
    return c.json({ requirement: updatedRequirement });
  } catch (error) {
    console.error("Error updating license requirement:", error);
    return c.json({ error: "Failed to update license requirement" }, 500);
  }
});

// Delete license requirement
app.delete("/make-server-f8517b5b/license-requirements/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const requirement = await kv.get(`license-requirement:${id}`);
    if (!requirement) {
      return c.json({ error: "Requirement not found" }, 404);
    }

    await kv.del(`license-requirement:${id}`);
    return c.json({ message: "Requirement deleted successfully" });
  } catch (error) {
    console.error("Error deleting license requirement:", error);
    return c.json({ error: "Failed to delete license requirement" }, 500);
  }
});

// ============================================
// RENEWAL TASKS, AUDIT TRAIL & RELATED FILINGS
// ============================================

// Get all renewal tasks
app.get("/make-server-f8517b5b/renewal-tasks", async (c) => {
  try {
    const tasks = await kv.getByPrefix("renewal-task:");
    return c.json({ tasks: tasks || [] });
  } catch (error) {
    console.error("Error fetching renewal tasks:", error);
    return c.json({ error: "Failed to fetch renewal tasks" }, 500);
  }
});

// Create renewal task
app.post("/make-server-f8517b5b/renewal-tasks", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const task = {
      id,
      licenseId: body.licenseId,
      licenseName: body.licenseName,
      taskType: body.taskType || 'renewal',
      assignedTo: body.assignedTo,
      assignedDepartment: body.assignedDepartment,
      dueDate: body.dueDate,
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      description: body.description,
      renewalFee: body.renewalFee,
      proofOfRenewalUrl: body.proofOfRenewalUrl || null,
      proofOfPaymentUrl: body.proofOfPaymentUrl || null,
      completedBy: body.completedBy || null,
      completedAt: body.completedAt || null,
      notes: body.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`renewal-task:${id}`, task);
    
    const auditId = crypto.randomUUID();
    await kv.set(`audit-trail:${body.licenseId}:${auditId}`, {
      id: auditId,
      licenseId: body.licenseId,
      action: 'task_created',
      performedBy: body.createdBy || 'system',
      details: `Renewal task created and assigned to ${body.assignedTo || body.assignedDepartment}`,
      timestamp: now
    });

    return c.json({ task }, 201);
  } catch (error) {
    console.error("Error creating renewal task:", error);
    return c.json({ error: "Failed to create renewal task" }, 500);
  }
});

// Update renewal task
app.put("/make-server-f8517b5b/renewal-tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const task = await kv.get(`renewal-task:${id}`);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    const updatedTask = {
      ...task,
      ...body,
      id,
      createdAt: task.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`renewal-task:${id}`, updatedTask);
    
    if (body.status === 'completed') {
      const auditId = crypto.randomUUID();
      await kv.set(`audit-trail:${task.licenseId}:${auditId}`, {
        id: auditId,
        licenseId: task.licenseId,
        action: 'renewal_completed',
        performedBy: body.completedBy || 'unknown',
        details: `Renewal task marked complete. ${body.proofOfRenewalUrl ? 'Proof uploaded.' : ''}`,
        timestamp: updatedTask.updatedAt,
        documentUrl: body.proofOfRenewalUrl
      });
    }

    return c.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating renewal task:", error);
    return c.json({ error: "Failed to update renewal task" }, 500);
  }
});

// Delete renewal task
app.delete("/make-server-f8517b5b/renewal-tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const task = await kv.get(`renewal-task:${id}`);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    await kv.del(`renewal-task:${id}`);
    return c.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting renewal task:", error);
    return c.json({ error: "Failed to delete renewal task" }, 500);
  }
});

// Get audit trail for a license
app.get("/make-server-f8517b5b/audit-trail/:licenseId", async (c) => {
  try {
    const licenseId = c.req.param("licenseId");
    const allAuditLogs = await kv.getByPrefix(`audit-trail:${licenseId}:`);
    
    const sortedLogs = (allAuditLogs || []).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return c.json({ auditLogs: sortedLogs });
  } catch (error) {
    console.error("Error fetching audit trail:", error);
    return c.json({ error: "Failed to fetch audit trail" }, 500);
  }
});

// Get related filings for a license
app.get("/make-server-f8517b5b/related-filings/:licenseId", async (c) => {
  try {
    const licenseId = c.req.param("licenseId");
    const filings = await kv.getByPrefix(`related-filing:${licenseId}:`);
    return c.json({ filings: filings || [] });
  } catch (error) {
    console.error("Error fetching related filings:", error);
    return c.json({ error: "Failed to fetch related filings" }, 500);
  }
});

// Create related filing
app.post("/make-server-f8517b5b/related-filings", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const filing = {
      id,
      licenseId: body.licenseId,
      filingType: body.filingType,
      filingName: body.filingName,
      filingNumber: body.filingNumber || null,
      dueDate: body.dueDate,
      filedDate: body.filedDate || null,
      status: body.status || 'pending',
      fee: body.fee || 0,
      documentUrl: body.documentUrl || null,
      notes: body.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`related-filing:${body.licenseId}:${id}`, filing);
    
    const auditId = crypto.randomUUID();
    await kv.set(`audit-trail:${body.licenseId}:${auditId}`, {
      id: auditId,
      licenseId: body.licenseId,
      action: 'related_filing_added',
      performedBy: body.createdBy || 'system',
      details: `Related filing added: ${body.filingName} (${body.filingType})`,
      timestamp: now
    });

    return c.json({ filing }, 201);
  } catch (error) {
    console.error("Error creating related filing:", error);
    return c.json({ error: "Failed to create related filing" }, 500);
  }
});

// Update related filing
app.put("/make-server-f8517b5b/related-filings/:licenseId/:id", async (c) => {
  try {
    const licenseId = c.req.param("licenseId");
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const filing = await kv.get(`related-filing:${licenseId}:${id}`);
    if (!filing) {
      return c.json({ error: "Filing not found" }, 404);
    }

    const updatedFiling = {
      ...filing,
      ...body,
      id,
      licenseId,
      createdAt: filing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`related-filing:${licenseId}:${id}`, updatedFiling);
    
    if (body.status === 'filed' && filing.status !== 'filed') {
      const auditId = crypto.randomUUID();
      await kv.set(`audit-trail:${licenseId}:${auditId}`, {
        id: auditId,
        licenseId,
        action: 'filing_completed',
        performedBy: body.updatedBy || 'unknown',
        details: `${filing.filingName} marked as filed`,
        timestamp: updatedFiling.updatedAt,
        documentUrl: body.documentUrl
      });
    }

    return c.json({ filing: updatedFiling });
  } catch (error) {
    console.error("Error updating related filing:", error);
    return c.json({ error: "Failed to update related filing" }, 500);
  }
});

// Delete related filing
app.delete("/make-server-f8517b5b/related-filings/:licenseId/:id", async (c) => {
  try {
    const licenseId = c.req.param("licenseId");
    const id = c.req.param("id");
    
    const filing = await kv.get(`related-filing:${licenseId}:${id}`);
    if (!filing) {
      return c.json({ error: "Filing not found" }, 404);
    }

    await kv.del(`related-filing:${licenseId}:${id}`);
    return c.json({ message: "Filing deleted successfully" });
  } catch (error) {
    console.error("Error deleting related filing:", error);
    return c.json({ error: "Failed to delete related filing" }, 500);
  }
});

// Get reminder settings
app.get("/make-server-f8517b5b/reminder-settings", async (c) => {
  try {
    const settings = await kv.get("reminder-settings") || {
      intervals: [120, 90, 60, 30],
      enabled: true,
      emailEnabled: false,
      notificationEnabled: true
    };
    return c.json({ settings });
  } catch (error) {
    console.error("Error fetching reminder settings:", error);
    return c.json({ error: "Failed to fetch reminder settings" }, 500);
  }
});

// Update reminder settings
app.put("/make-server-f8517b5b/reminder-settings", async (c) => {
  try {
    const body = await c.req.json();
    
    const settings = {
      intervals: body.intervals || [120, 90, 60, 30],
      enabled: body.enabled !== undefined ? body.enabled : true,
      emailEnabled: body.emailEnabled || false,
      notificationEnabled: body.notificationEnabled !== undefined ? body.notificationEnabled : true,
      updatedAt: new Date().toISOString(),
    };

    await kv.set("reminder-settings", settings);
    return c.json({ settings });
  } catch (error) {
    console.error("Error updating reminder settings:", error);
    return c.json({ error: "Failed to update reminder settings" }, 500);
  }
});

// Check and create reminders for expiring licenses
app.post("/make-server-f8517b5b/check-reminders", async (c) => {
  try {
    const settings = await kv.get("reminder-settings") || {
      intervals: [120, 90, 60, 30],
      enabled: true
    };

    if (!settings.enabled) {
      return c.json({ message: "Reminders are disabled", remindersCreated: 0 });
    }

    const licenses = await kv.getByPrefix("business-license:");
    const today = new Date();
    let remindersCreated = 0;

    for (const license of licenses) {
      if (!license.expiryDate || license.status === 'archived') continue;

      const expiryDate = new Date(license.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      for (const interval of settings.intervals) {
        if (daysUntilExpiry === interval) {
          const reminderKey = `reminder-sent:${license.id}:${interval}`;
          const alreadySent = await kv.get(reminderKey);

          if (!alreadySent) {
            const existingTasks = await kv.getByPrefix(`renewal-task:`);
            const hasActiveTask = existingTasks.some(t => 
              t.licenseId === license.id && 
              t.status !== 'completed' && 
              t.status !== 'cancelled'
            );

            if (!hasActiveTask) {
              const taskId = crypto.randomUUID();
              const now = new Date().toISOString();
              const task = {
                id: taskId,
                licenseId: license.id,
                licenseName: license.licenseName,
                taskType: 'renewal',
                assignedDepartment: license.responsibleDepartment || 'Licensing',
                assignedTo: license.responsibleOwner || null,
                dueDate: license.expiryDate,
                priority: daysUntilExpiry <= 30 ? 'urgent' : daysUntilExpiry <= 60 ? 'high' : 'medium',
                status: 'pending',
                description: `License renewal due in ${daysUntilExpiry} days`,
                renewalFee: license.renewalFee || 0,
                createdAt: now,
                updatedAt: now,
              };

              await kv.set(`renewal-task:${taskId}`, task);
              
              const auditId = crypto.randomUUID();
              await kv.set(`audit-trail:${license.id}:${auditId}`, {
                id: auditId,
                licenseId: license.id,
                action: 'reminder_sent',
                performedBy: 'system',
                details: `Automated reminder sent: ${daysUntilExpiry} days until expiry`,
                timestamp: now
              });
            }

            await kv.set(reminderKey, { sent: true, sentAt: new Date().toISOString() });
            remindersCreated++;
          }
        }
      }
    }

    return c.json({ 
      message: "Reminder check completed", 
      remindersCreated,
      licensesChecked: licenses.length 
    });
  } catch (error) {
    console.error("Error checking reminders:", error);
    return c.json({ error: "Failed to check reminders" }, 500);
  }
});

// ============================================
// PROJECT ENDPOINTS
// ============================================

// Get all projects
app.get("/make-server-f8517b5b/projects", async (c) => {
  try {
    const assignments = await kv.get("project_assignments") || [];
    // Extract unique projects from assignments
    const projectMap = new Map();
    
    for (const a of assignments) {
      const projectId = a.projectId || a.id;
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          id: projectId,
          name: a.projectName,
          clientId: a.clientId,
          clientName: a.clientName,
          status: a.status,
          startDate: a.startDate,
          endDate: a.endDate,
        });
      }
    }
    
    const projects = Array.from(projectMap.values());
    
    return c.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return c.json({ error: "Failed to fetch projects", details: String(error) }, 500);
  }
});

// ============================================
// CLIENT MANAGEMENT ENDPOINTS
// ============================================

// Get all clients (basic endpoint for dropdowns/lists)
app.get("/make-server-f8517b5b/clients", async (c) => {
  try {
    console.log("Fetching clients (basic) with kv.getByPrefix...");
    const clients = await kv.getByPrefix("client:");
    console.log(`Found ${clients?.length || 0} clients`);
    return c.json({ clients: clients || [] });
  } catch (error) {
    console.error("Error fetching clients (basic) - Full error:", error);
    return c.json({ 
      error: "Failed to fetch clients", 
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all clients (enhanced)
app.get("/make-server-f8517b5b/clients-enhanced", async (c) => {
  try {
    console.log("Fetching clients (enhanced) with kv.getByPrefix...");
    const clients = await kv.getByPrefix("client:");
    console.log(`Found ${clients?.length || 0} clients`);
    return c.json({ clients: clients || [] });
  } catch (error) {
    console.error("Error fetching clients (enhanced) - Full error:", error);
    return c.json({ 
      error: "Failed to fetch clients", 
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all clients (advanced)
app.get("/make-server-f8517b5b/clients/advanced", async (c) => {
  try {
    console.log("Fetching clients with kv.getByPrefix...");
    const clients = await kv.getByPrefix("client:");
    console.log(`Found ${clients?.length || 0} clients`);
    return c.json({ clients: clients || [] });
  } catch (error) {
    console.error("Error fetching clients - Full error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    return c.json({ 
      error: "Failed to fetch clients", 
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get single client
app.get("/make-server-f8517b5b/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const client = await kv.get(`client:${id}`);
    
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    return c.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return c.json({ error: "Failed to fetch client", details: String(error) }, 500);
  }
});

// Create advanced client (with extended fields from Req 4.1)
app.post("/make-server-f8517b5b/clients/advanced", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.companyName || !body.legalName || !body.taxId) {
      return c.json({ error: "Missing required fields: companyName, legalName, and taxId are required" }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newClient = {
      id,
      ...body,
      contacts: (body.contacts || []).map((contact: any) => ({
        ...contact,
        id: contact.id || crypto.randomUUID(),
        clientId: id,
      })),
      engagements: body.engagements || [],
      purchaseOrders: body.purchaseOrders || [],
      documents: body.documents || [],
      employees: body.employees || [],
      activeEngagements: body.activeEngagements || 0,
      totalEngagementValue: body.totalEngagementValue || 0,
      documentsComplete: body.documentsComplete || false,
      contractSigned: body.contractSigned || false,
      canGenerateInvoices: body.canGenerateInvoices || false,
      onboardingStatus: body.onboardingStatus || 'not-started',
      isActive: body.isActive !== undefined ? body.isActive : true,
      hasComplianceIssues: body.hasComplianceIssues || false,
      hasExpiringPOs: body.hasExpiringPOs || false,
      hasExpiringDocuments: body.hasExpiringDocuments || false,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`client:advanced:${id}`, newClient);
    console.log(`Created advanced client: ${newClient.companyName} with ID: ${id}`);

    return c.json({ client: newClient }, 201);
  } catch (error) {
    console.error("Error creating advanced client:", error);
    return c.json({ error: "Failed to create advanced client", details: String(error) }, 500);
  }
});

// Create client
app.post("/make-server-f8517b5b/clients", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.companyName) {
      return c.json({ error: "Missing required field: companyName" }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newClient = {
      id,
      ...body,
      contacts: (body.contacts || []).map((contact: any) => ({
        ...contact,
        id: contact.id || crypto.randomUUID(),
        clientId: id,
      })),
      engagements: body.engagements || [],
      purchaseOrders: body.purchaseOrders || [],
      documents: body.documents || [],
      employees: body.employees || [],
      activeEmployeeCount: body.activeEmployeeCount || 0,
      totalRevenue: body.totalRevenue || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      complianceStatus: body.complianceStatus || 'compliant',
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`client:${id}`, newClient);

    return c.json({ client: newClient }, 201);
  } catch (error) {
    console.error("Error creating client:", error);
    return c.json({ error: "Failed to create client", details: String(error) }, 500);
  }
});

// Update client
app.put("/make-server-f8517b5b/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingClient = await kv.get(`client:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    const now = new Date().toISOString();

    const updatedClient = {
      ...existingClient,
      ...body,
      contacts: (body.contacts || existingClient.contacts || []).map((contact: any) => ({
        ...contact,
        id: contact.id || crypto.randomUUID(),
        clientId: id,
      })),
      id,
      createdAt: existingClient.createdAt,
      updatedAt: now,
    };

    await kv.set(`client:${id}`, updatedClient);

    return c.json({ client: updatedClient });
  } catch (error) {
    console.error("Error updating client:", error);
    return c.json({ error: "Failed to update client", details: String(error) }, 500);
  }
});

// Delete client
app.delete("/make-server-f8517b5b/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const client = await kv.get(`client:${id}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    await kv.del(`client:${id}`);

    return c.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return c.json({ error: "Failed to delete client", details: String(error) }, 500);
  }
});

// Add engagement to client
app.post("/make-server-f8517b5b/clients/:id/engagements", async (c) => {
  try {
    const clientId = c.req.param("id");
    const body = await c.req.json();
    
    const client = await kv.get(`client:${clientId}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const engagementId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newEngagement = {
      id: engagementId,
      clientId,
      ...body,
      purchaseOrders: body.purchaseOrders || [],
      createdAt: now,
      updatedAt: now,
    };

    client.engagements = client.engagements || [];
    client.engagements.push(newEngagement);
    client.updatedAt = now;

    await kv.set(`client:${clientId}`, client);

    return c.json({ engagement: newEngagement, client }, 201);
  } catch (error) {
    console.error("Error adding engagement:", error);
    return c.json({ error: "Failed to add engagement", details: String(error) }, 500);
  }
});

// Add purchase order to engagement
app.post("/make-server-f8517b5b/clients/:clientId/engagements/:engagementId/purchase-orders", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const engagementId = c.req.param("engagementId");
    const body = await c.req.json();
    
    const client = await kv.get(`client:${clientId}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const engagement = client.engagements?.find((e: any) => e.id === engagementId);
    if (!engagement) {
      return c.json({ error: "Engagement not found" }, 404);
    }

    const poId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newPO = {
      id: poId,
      engagementId,
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    engagement.purchaseOrders = engagement.purchaseOrders || [];
    engagement.purchaseOrders.push(newPO);
    client.updatedAt = now;

    // Also add to client-level POs
    client.purchaseOrders = client.purchaseOrders || [];
    client.purchaseOrders.push(newPO);

    await kv.set(`client:${clientId}`, client);

    return c.json({ purchaseOrder: newPO, client }, 201);
  } catch (error) {
    console.error("Error adding purchase order:", error);
    return c.json({ error: "Failed to add purchase order", details: String(error) }, 500);
  }
});

// Upload client document
app.post("/make-server-f8517b5b/clients/:id/documents", async (c) => {
  try {
    const clientId = c.req.param("id");
    const body = await c.req.json();
    
    const client = await kv.get(`client:${clientId}`);
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const documentId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newDocument = {
      id: documentId,
      clientId,
      ...body,
      uploadedAt: now,
      version: 1,
      status: body.status || 'active',
    };

    client.documents = client.documents || [];
    client.documents.push(newDocument);
    client.updatedAt = now;

    await kv.set(`client:${clientId}`, client);

    return c.json({ document: newDocument, client }, 201);
  } catch (error) {
    console.error("Error uploading document:", error);
    return c.json({ error: "Failed to upload document", details: String(error) }, 500);
  }
});

// ============================================
// SUBSCRIPTION & ORGANIZATION ENDPOINTS
// ============================================

// Create organization with subscription
app.post("/make-server-f8517b5b/signup", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.firstName || !body.lastName || !body.email || !body.password || !body.organizationName || !body.selectedPlan) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const now = new Date().toISOString();
    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const subscriptionId = crypto.randomUUID();

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Calculate subscription end date based on billing cycle
    const subscriptionEndDate = new Date();
    if (body.billingCycle === 'annual') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    // Create organization
    const organization = {
      id: orgId,
      name: body.organizationName,
      email: body.email,
      phone: body.phone || '',
      industry: body.industry || '',
      companySize: body.companySize || '',
      address: '',
      taxId: '',
      subscriptionId: subscriptionId,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`organization:${orgId}`, organization);

    // Get subscription plan configuration (from admin config or defaults)
    let planConfig = await kv.get("subscription:plan-config");
    
    // Default configuration if not set
    if (!planConfig) {
      planConfig = {
        free: {
          monthlyPrice: 0,
          annualPrice: 0,
          features: {
            maxEmployees: 5,
            maxClients: 3,
            immigrationManagement: false,
            licensingManagement: false,
            documentStorage: '1GB',
            customWorkflows: false,
            apiAccess: false,
            dedicatedSupport: false,
            sla: 'Community Support',
            ssoEnabled: false,
            customReports: false,
            auditLogs: false,
            advancedAnalytics: false,
            multiCompany: false,
          }
        },
        starter: {
          monthlyPrice: 99,
          annualPrice: 990,
          features: {
            maxEmployees: 25,
            maxClients: 10,
            immigrationManagement: false,
            licensingManagement: false,
            documentStorage: '10GB',
            customWorkflows: false,
            apiAccess: false,
            dedicatedSupport: false,
            sla: 'Standard (Business Hours)',
            ssoEnabled: false,
            customReports: false,
            auditLogs: false,
            advancedAnalytics: false,
            multiCompany: false,
          }
        },
        professional: {
          monthlyPrice: 299,
          annualPrice: 2990,
          features: {
            maxEmployees: 100,
            maxClients: 50,
            immigrationManagement: true,
            licensingManagement: true,
            documentStorage: '100GB',
            customWorkflows: true,
            apiAccess: true,
            dedicatedSupport: true,
            sla: 'Priority (24/5)',
            ssoEnabled: true,
            customReports: true,
            auditLogs: true,
            advancedAnalytics: false,
            multiCompany: false,
          }
        },
        enterprise: {
          monthlyPrice: 999,
          annualPrice: 9990,
          features: {
            maxEmployees: 9999,
            maxClients: 9999,
            immigrationManagement: true,
            licensingManagement: true,
            documentStorage: 'Unlimited',
            customWorkflows: true,
            apiAccess: true,
            dedicatedSupport: true,
            sla: '24/7 with dedicated account manager',
            ssoEnabled: true,
            customReports: true,
            auditLogs: true,
            advancedAnalytics: true,
            multiCompany: true,
          }
        },
      };
    }

    const selectedPlan = body.selectedPlan;
    const billingCycle = body.billingCycle || 'monthly';
    const selectedPlanConfig = planConfig[selectedPlan];
    
    // Check if plan exists
    if (!selectedPlanConfig) {
      return c.json({ error: `Invalid plan selected: ${selectedPlan}` }, 400);
    }
    
    const price = billingCycle === 'annual' ? selectedPlanConfig.annualPrice : selectedPlanConfig.monthlyPrice;

    // Create subscription
    const subscription = {
      id: subscriptionId,
      organizationId: orgId,
      plan: selectedPlan,
      status: 'trial',
      features: selectedPlanConfig.features,
      billingCycle: billingCycle,
      price: price,
      currency: 'USD',
      startDate: now,
      endDate: subscriptionEndDate.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      autoRenew: true,
      seats: 5, // Default 5 admin seats
      usedSeats: 1, // Admin user
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`subscription:${subscriptionId}`, subscription);

    // Create admin user
    const adminUser = {
      id: userId,
      organizationId: orgId,
      email: body.email,
      // In production, hash the password!
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      name: `${body.firstName} ${body.lastName}`,
      role: 'admin',
      active: true,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`user:${userId}`, adminUser);
    await kv.set(`user:email:${body.email}`, userId);

    return c.json({
      success: true,
      message: 'Account created successfully',
      organization: organization,
      subscription: subscription,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    }, 201);
  } catch (error) {
    console.error("Error creating account:", error);
    return c.json({ error: "Failed to create account", details: String(error) }, 500);
  }
});

// Get organization by ID
app.get("/make-server-f8517b5b/organizations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const organization = await kv.get(`organization:${id}`);
    
    if (!organization) {
      return c.json({ error: "Organization not found" }, 404);
    }
    
    return c.json({ organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return c.json({ error: "Failed to fetch organization" }, 500);
  }
});

// Get subscription by ID
app.get("/make-server-f8517b5b/subscriptions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const subscription = await kv.get(`subscription:${id}`);
    
    if (!subscription) {
      return c.json({ error: "Subscription not found" }, 404);
    }
    
    return c.json({ subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return c.json({ error: "Failed to fetch subscription" }, 500);
  }
});

// Update subscription
app.put("/make-server-f8517b5b/subscriptions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const subscription = await kv.get(`subscription:${id}`);
    if (!subscription) {
      return c.json({ error: "Subscription not found" }, 404);
    }

    const updatedSubscription = {
      ...subscription,
      ...body,
      id,
      createdAt: subscription.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`subscription:${id}`, updatedSubscription);
    return c.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return c.json({ error: "Failed to update subscription" }, 500);
  }
});

// ============================================
// SUBSCRIPTION CONFIGURATION ENDPOINTS
// ============================================

// Get subscription plan configuration
app.get("/make-server-f8517b5b/subscription-config", async (c) => {
  try {
    const config = await kv.get("subscription:plan-config");
    
    if (!config) {
      // Return default configuration
      const defaultConfig = {
        starter: {
          name: 'Starter',
          description: 'Perfect for small businesses getting started',
          monthlyPrice: 99,
          annualPrice: 990,
          features: {
            maxEmployees: 25,
            maxClients: 10,
            immigrationManagement: false,
            licensingManagement: false,
            documentStorage: '10GB',
            customWorkflows: false,
            apiAccess: false,
            dedicatedSupport: false,
            sla: 'Standard (Business Hours)',
            ssoEnabled: false,
            customReports: false,
            auditLogs: false,
            advancedAnalytics: false,
            multiCompany: false,
          },
          cta: 'Start Free Trial',
          enabled: true,
        },
        professional: {
          name: 'Professional',
          description: 'Ideal for growing companies with advanced needs',
          monthlyPrice: 299,
          annualPrice: 2990,
          popular: true,
          features: {
            maxEmployees: 100,
            maxClients: 50,
            immigrationManagement: true,
            licensingManagement: true,
            documentStorage: '100GB',
            customWorkflows: true,
            apiAccess: true,
            dedicatedSupport: true,
            sla: 'Priority (24/5)',
            ssoEnabled: true,
            customReports: true,
            auditLogs: true,
            advancedAnalytics: false,
            multiCompany: false,
          },
          cta: 'Start Free Trial',
          enabled: true,
        },
        enterprise: {
          name: 'Enterprise',
          description: 'For large organizations with complex requirements',
          monthlyPrice: 999,
          annualPrice: 9990,
          features: {
            maxEmployees: 9999,
            maxClients: 9999,
            immigrationManagement: true,
            licensingManagement: true,
            documentStorage: 'Unlimited',
            customWorkflows: true,
            apiAccess: true,
            dedicatedSupport: true,
            sla: '24/7 with dedicated account manager',
            ssoEnabled: true,
            customReports: true,
            auditLogs: true,
            advancedAnalytics: true,
            multiCompany: true,
          },
          cta: 'Contact Sales',
          enabled: true,
        },
      };
      
      return c.json({ config: defaultConfig });
    }
    
    return c.json({ config });
  } catch (error) {
    console.error("Error fetching subscription config:", error);
    return c.json({ error: "Failed to fetch subscription configuration", details: String(error) }, 500);
  }
});

// Update subscription plan configuration
app.put("/make-server-f8517b5b/subscription-config", async (c) => {
  try {
    const body = await c.req.json();
    const { config } = body;
    
    if (!config) {
      return c.json({ error: "Configuration data is required" }, 400);
    }
    
    // Validate config structure
    const requiredPlans = ['starter', 'professional', 'enterprise'];
    for (const plan of requiredPlans) {
      if (!config[plan]) {
        return c.json({ error: `Missing configuration for ${plan} plan` }, 400);
      }
    }
    
    // Save configuration
    await kv.set("subscription:plan-config", config);
    
    // Log the configuration change
    const auditLog = {
      id: crypto.randomUUID(),
      action: 'subscription_config_updated',
      timestamp: new Date().toISOString(),
      details: 'Subscription plan configuration updated',
    };
    await kv.set(`audit:${auditLog.id}`, auditLog);
    
    return c.json({ 
      success: true,
      message: 'Subscription configuration updated successfully',
      config 
    });
  } catch (error) {
    console.error("Error updating subscription config:", error);
    return c.json({ error: "Failed to update subscription configuration", details: String(error) }, 500);
  }
});

// ============================================
// DATA MANAGEMENT ENDPOINTS
// ============================================

// Reset all data (for development/testing purposes)
app.post("/make-server-f8517b5b/reset-data", async (c) => {
  try {
    console.log("Starting data reset...");
    
    // Get all keys by prefix and delete them
    const prefixes = [
      "employee:",
      "client:",
      "immigration:record:",
      "immigration:case:",
      "immigration:cost:",
      "immigration:dependent:",
      "document:",
      "timesheet:",
      "onboarding:workflow:",
      "offboarding:",
      "performance-review:",
      "leave-request:",
      "business-license:",
      "alert:",
      "subscription:"
    ];
    
    let deletedCount = 0;
    
    for (const prefix of prefixes) {
      const records = await kv.getByPrefix(prefix);
      console.log(`Found ${records?.length || 0} records with prefix ${prefix}`);
      
      if (records && records.length > 0) {
        // Extract keys from records
        for (const record of records) {
          // Reconstruct the key based on the record structure
          let key = "";
          
          if (prefix === "employee:" && record.id) {
            key = `employee:${record.id}`;
          } else if (prefix === "client:" && record.id) {
            key = `client:${record.id}`;
          } else if (prefix === "immigration:record:" && record.id) {
            key = `immigration:record:${record.id}`;
          } else if (prefix === "immigration:case:" && record.id) {
            key = `immigration:case:${record.id}`;
          } else if (prefix === "immigration:cost:" && record.id) {
            key = `immigration:cost:${record.id}`;
          } else if (prefix === "immigration:dependent:" && record.id) {
            key = `immigration:dependent:${record.id}`;
          } else if (prefix === "document:" && record.id) {
            key = `document:${record.id}`;
          } else if (prefix === "timesheet:" && record.id) {
            key = `timesheet:${record.id}`;
          } else if (prefix === "onboarding:workflow:" && record.id) {
            key = `onboarding:workflow:${record.id}`;
          } else if (prefix === "offboarding:" && record.id) {
            key = `offboarding:${record.id}`;
          } else if (prefix === "performance-review:" && record.id) {
            key = `performance-review:${record.id}`;
          } else if (prefix === "leave-request:" && record.id) {
            key = `leave-request:${record.id}`;
          } else if (prefix === "business-license:" && record.id) {
            key = `business-license:${record.id}`;
          } else if (prefix === "alert:" && record.id) {
            key = `alert:${record.id}`;
          } else if (prefix === "subscription:" && record.id) {
            key = `subscription:${record.id}`;
          }
          
          if (key) {
            await kv.del(key);
            deletedCount++;
          }
        }
      }
    }
    
    console.log(`Data reset complete. Deleted ${deletedCount} records.`);
    
    return c.json({ 
      message: "All data has been reset successfully",
      deletedCount 
    });
  } catch (error) {
    console.error("Error resetting data:", error);
    return c.json({ error: "Failed to reset data" }, 500);
  }
});

// Seed demo data
app.post("/make-server-f8517b5b/seed-demo-data", async (c) => {
  try {
    console.log("Starting demo data seeding...");
    
    const now = new Date().toISOString();
    const createdEntities = {
      clients: 0,
      employees: 0,
      immigrationRecords: 0,
      immigrationCases: 0,
      businessLicenses: 0,
      timesheets: 0,
      leaveRequests: 0,
      performanceReviews: 0,
    };

    // Sample data arrays
    const firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "James", "Amanda", "Robert", "Jennifer", "William", "Ashley", "Daniel", "Melissa", "Matthew", "Stephanie"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas"];
    const positions = ["Software Engineer", "Data Analyst", "Project Manager", "UX Designer", "DevOps Engineer", "Product Manager", "QA Engineer", "Business Analyst"];
    const departments = ["Engineering", "Product", "Design", "Operations", "Sales", "Marketing"];
    const visaTypes = ["H-1B", "OPT", "STEM OPT", "L-1", "TN", "Green Card", "Citizen"];
    const companies = ["Tech Innovations Inc", "Global Solutions LLC", "Digital Dynamics Corp", "Cloud Systems Ltd", "Data Insights Group"];
    const industries = ["Technology", "Healthcare", "Finance", "E-commerce", "Consulting"];
    
    // Create 5 demo clients
    for (let i = 0; i < 5; i++) {
      const clientId = crypto.randomUUID();
      const client = {
        id: clientId,
        companyName: companies[i],
        industry: industries[i],
        contactPerson: `${firstNames[i]} ${lastNames[i]}`,
        email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@${companies[i].toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        address: `${Math.floor(Math.random() * 9999) + 1} Main Street, Suite ${Math.floor(Math.random() * 500)}`,
        billingAddress: `${Math.floor(Math.random() * 9999) + 1} Billing Ave`,
        taxId: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000) + 1000000}`,
        onboardingStatus: i < 2 ? "completed" : i < 4 ? "in-progress" : "not-started",
        msaStatus: i < 3 ? "signed" : "pending",
        insuranceVerified: i < 3,
        paymentTerms: i % 2 === 0 ? "Net 30" : "Net 45",
        createdAt: now,
        updatedAt: now,
      };
      await kv.set(`client:${clientId}`, client);
      createdEntities.clients++;
    }

    // Create 20 demo employees with workflow
    const clientList = await kv.getByPrefix("client:");
    const workflowStages = ["initiation", "data-collection", "verification", "payroll-setup", "licensing", "classification", "finalization", "completed"];
    
    for (let i = 0; i < 20; i++) {
      const employeeId = crypto.randomUUID();
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const position = positions[i % positions.length];
      const visaType = visaTypes[i % visaTypes.length];
      const currentStage = workflowStages[Math.floor(i / 2.5) % workflowStages.length];
      const classification = i < 12 ? "billable" : i < 17 ? "non-billable" : "operational";
      
      // Calculate tasks completion based on stage
      const stageIndex = workflowStages.indexOf(currentStage);
      const totalTasks = 30;
      const completedTasks = Math.floor((stageIndex / workflowStages.length) * totalTasks);
      
      const tasks = [];
      for (let t = 0; t < totalTasks; t++) {
        tasks.push({
          id: crypto.randomUUID(),
          taskName: `Task ${t + 1}`,
          department: ["HR", "Recruiter", "Accounting", "Immigration", "Licensing"][t % 5],
          status: t < completedTasks ? "completed" : t === completedTasks ? "in-progress" : "pending",
          assignedTo: `${firstNames[t % firstNames.length]} ${lastNames[t % lastNames.length]}`,
        });
      }
      
      const employee = {
        id: employeeId,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        dateOfBirth: `19${85 + (i % 10)}-0${(i % 9) + 1}-15`,
        address: `${Math.floor(Math.random() * 9999) + 1} Employee St`,
        homeState: ["CA", "NY", "TX", "FL", "WA"][i % 5],
        position,
        department: departments[i % departments.length],
        startDate: new Date(Date.now() - (i * 10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        salary: String((80000 + (i * 5000))),
        employmentType: i % 3 === 0 ? "W2" : "full-time",
        immigrationStatus: visaType,
        visaType: visaType !== "Citizen" ? visaType : undefined,
        visaExpiry: visaType !== "Citizen" ? new Date(Date.now() + (365 + i * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        bankAccount: `****${Math.floor(Math.random() * 9000) + 1000}`,
        taxId: `***-**-${Math.floor(Math.random() * 9000) + 1000}`,
        onboardingStatus: currentStage === "completed" ? "completed" : "in-progress",
        documentsUploaded: stageIndex >= 2,
        complianceComplete: stageIndex >= 3,
        canAccessTimesheets: currentStage === "completed",
        classification,
        isBillable: classification === "billable",
        isOperational: classification === "operational",
        clientId: classification === "billable" && clientList && clientList[i % clientList.length] ? clientList[i % clientList.length].id : undefined,
        clientName: classification === "billable" && clientList && clientList[i % clientList.length] ? clientList[i % clientList.length].companyName : undefined,
        workflow: {
          currentStage,
          tasks,
          departmentApprovals: [
            { department: "HR", status: stageIndex > 1 ? "approved" : "pending" },
            { department: "Recruiter", status: stageIndex > 2 ? "approved" : "pending" },
            { department: "Accounting", status: stageIndex > 4 ? "approved" : "pending" },
            { department: "Immigration", status: stageIndex > 3 ? "approved" : "pending" },
            { department: "Licensing", status: stageIndex > 5 ? "approved" : "pending" },
          ],
          initiatedDate: new Date(Date.now() - (i * 5 * 24 * 60 * 60 * 1000)).toISOString(),
          employeeClassification: classification,
          classificationVerified: stageIndex >= 6,
        },
        createdAt: now,
      };
      
      await kv.set(`employee:${employeeId}`, employee);
      createdEntities.employees++;
      
      // Create immigration record for each employee
      if (visaType !== "Citizen") {
        const immigrationId = crypto.randomUUID();
        const eadExpiry = new Date(Date.now() + (180 + i * 20) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const immigrationRecord = {
          id: immigrationId,
          employeeId,
          employeeName: `${firstName} ${lastName}`,
          email: employee.email,
          currentStatus: visaType,
          workAuthorizationExpiry: employee.visaExpiry,
          eadNumber: `EAD${Math.floor(Math.random() * 900000000) + 100000000}`,
          eadExpiryDate: eadExpiry,
          i94Number: `I94${Math.floor(Math.random() * 900000000) + 100000000}`,
          i94Expiry: employee.visaExpiry,
          passportNumber: `P${Math.floor(Math.random() * 9000000) + 1000000}`,
          passportCountry: ["India", "China", "Mexico", "Canada", "UK"][i % 5],
          passportExpiryDate: new Date(Date.now() + (1825 + i * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          requiresSponsorship: visaType.includes("H-1B") || visaType.includes("L-1"),
          hasActiveGCProcess: i % 5 === 0,
          cases: [],
          filings: [],
          documents: [],
          dependents: [],
          costs: [],
          alerts: [],
          alertSettings: {
            days120: true,
            days90: true,
            days60: true,
            days30: true,
          },
          notes: "",
          auditHistory: [],
          createdAt: now,
          updatedAt: now,
        };
        
        await kv.set(`immigration:record:${immigrationId}`, immigrationRecord);
        createdEntities.immigrationRecords++;
        
        // Create some immigration cases for H-1B employees
        if (visaType === "H-1B" && i % 3 === 0) {
          const caseId = crypto.randomUUID();
          const caseTypes = ["H-1B Extension", "H-1B Amendment", "H-1B Transfer"];
          const statuses = ["Approved", "Filed", "In Preparation", "Pending"];
          
          const immigrationCase = {
            id: caseId,
            employeeId,
            caseNumber: `CASE-2025-${firstName.substring(0,1)}${lastName.substring(0,1)}-${String(i).padStart(3, '0')}`,
            caseType: caseTypes[i % 3],
            receiptNumber: `RCP${Math.floor(Math.random() * 900000000) + 100000000}`,
            uscisCenter: ["Vermont", "California", "Texas", "Nebraska"][i % 4],
            filedDate: new Date(Date.now() - (180 - i * 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: statuses[i % 4],
            assignedAnalyst: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
            assignedAttorney: `Attorney ${lastNames[i % lastNames.length]}`,
            notes: "",
            documents: [],
            costs: [],
            timeline: [],
            createdAt: now,
            updatedAt: now,
          };
          
          await kv.set(`immigration:case:${caseId}`, immigrationCase);
          createdEntities.immigrationCases++;
        }
      }
    }
    
    // Create 8 business licenses
    const licenseTypes = ["State Tax Registration", "Unemployment Insurance", "Workers Compensation", "Professional License"];
    const states = ["CA", "NY", "TX", "FL", "WA", "IL", "PA", "OH"];
    
    for (let i = 0; i < 8; i++) {
      const licenseId = crypto.randomUUID();
      const issueDate = new Date(Date.now() - (730 - i * 60) * 24 * 60 * 60 * 1000);
      const expiryDate = new Date(issueDate.getTime() + (365 * 24 * 60 * 60 * 1000));
      
      const license = {
        id: licenseId,
        licenseName: `${states[i]} ${licenseTypes[i % licenseTypes.length]}`,
        licenseType: licenseTypes[i % licenseTypes.length],
        licenseNumber: `LIC-${states[i]}-${Math.floor(Math.random() * 900000) + 100000}`,
        issueDate: issueDate.toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        state: states[i],
        issuingAuthority: `${states[i]} Department of Revenue`,
        status: expiryDate > new Date() ? "active" : "expired",
        renewalRequired: new Date(expiryDate.getTime() - 90 * 24 * 60 * 60 * 1000) < new Date(),
        notes: "",
        createdAt: now,
      };
      
      await kv.set(`business-license:${licenseId}`, license);
      createdEntities.businessLicenses++;
    }
    
    // Create some timesheets for billable employees
    const employees = await kv.getByPrefix("employee:");
    const billableEmployees = employees.filter((e: any) => e.classification === "billable" && e.canAccessTimesheets);
    
    for (const emp of billableEmployees.slice(0, 10)) {
      for (let week = 0; week < 4; week++) {
        const timesheetId = crypto.randomUUID();
        const weekStart = new Date(Date.now() - (week * 7 + 3) * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        const timesheet = {
          id: timesheetId,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          clientId: emp.clientId,
          clientName: emp.clientName,
          weekStarting: weekStart.toISOString().split('T')[0],
          weekEnding: weekEnd.toISOString().split('T')[0],
          totalHours: 40,
          status: week === 0 ? "draft" : "submitted",
          submittedDate: week > 0 ? new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000).toISOString() : undefined,
          entries: Array.from({ length: 5 }, (_, i) => ({
            date: new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            hours: 8,
            description: "Client project work",
          })),
          createdAt: now,
        };
        
        await kv.set(`timesheet:${timesheetId}`, timesheet);
        createdEntities.timesheets++;
      }
    }
    
    // Create some leave requests
    for (let i = 0; i < 10 && i < employees.length; i++) {
      const emp = employees[i];
      const leaveId = crypto.randomUUID();
      const startDate = new Date(Date.now() + (i * 7 + 14) * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const leaveRequest = {
        id: leaveId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        leaveType: ["Vacation", "Sick Leave", "Personal"][i % 3],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalDays: 4,
        status: i % 3 === 0 ? "approved" : i % 3 === 1 ? "pending" : "rejected",
        reason: "Personal matters",
        createdAt: now,
      };
      
      await kv.set(`leave-request:${leaveId}`, leaveRequest);
      createdEntities.leaveRequests++;
    }
    
    // Create some performance reviews
    for (let i = 0; i < 8 && i < employees.length; i++) {
      const emp = employees[i];
      const reviewId = crypto.randomUUID();
      
      const review = {
        id: reviewId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        reviewPeriod: `Q${(i % 4) + 1} 2024`,
        rating: Math.floor(Math.random() * 3) + 3, // 3-5
        status: i % 2 === 0 ? "completed" : "in-progress",
        reviewDate: new Date(Date.now() - (30 + i * 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: now,
      };
      
      await kv.set(`performance-review:${reviewId}`, review);
      createdEntities.performanceReviews++;
    }
    
    console.log("Demo data seeding completed:", createdEntities);
    
    return c.json({
      success: true,
      message: "Demo data seeded successfully",
      created: createdEntities,
    });
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return c.json({ error: "Failed to seed demo data", details: String(error) }, 500);
  }
});

// ============================================
// PROJECT ASSIGNMENTS ENDPOINTS
// ============================================

// Get all project assignments
app.get("/make-server-f8517b5b/project-assignments", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    let assignments = await kv.get("project_assignments") || [];
    
    // Auto-repair: If assignments are missing projectName but have projectId, try to populate it
    let needsRepair = false;
    const allProjects = await kv.getByPrefix("project:");
    const allTimesheets = await kv.getByPrefix("timesheet:");
    
    assignments = assignments.map((assignment: any) => {
      if (!assignment.projectName && assignment.projectId) {
        // Try to find the project by ID
        const project = allProjects.find((p: any) => p.id === assignment.projectId);
        if (project?.name) {
          console.log(`[Auto-repair] Adding projectName "${project.name}" to assignment ${assignment.id}`);
          assignment.projectName = project.name;
          needsRepair = true;
        }
      }
      
      // If still no projectName, try to infer from timesheets
      if (!assignment.projectName && assignment.employeeId) {
        const employeeTimesheets = allTimesheets.filter((ts: any) => 
          ts.employeeId === assignment.employeeId && 
          ts.clientId === assignment.clientId &&
          (ts.projectName || ts.project)
        );
        
        if (employeeTimesheets.length > 0) {
          const inferredProjectName = employeeTimesheets[0].projectName || employeeTimesheets[0].project;
          console.log(`[Auto-repair] Inferring projectName "${inferredProjectName}" from timesheet for assignment ${assignment.id}`);
          assignment.projectName = inferredProjectName;
          needsRepair = true;
        }
      }
      
      return assignment;
    });
    
    // Save repaired assignments
    if (needsRepair) {
      await kv.set("project_assignments", assignments);
      console.log(`[Auto-repair] Saved ${assignments.length} repaired project assignments`);
    }
    
    // Filter by employeeId if provided
    if (employeeId) {
      assignments = assignments.filter((a: any) => a.employeeId === employeeId);
    }
    
    return c.json({ assignments });
  } catch (error) {
    console.error("Error fetching project assignments:", error);
    return c.json({ error: "Failed to fetch project assignments" }, 500);
  }
});

// Create new project assignment
app.post("/make-server-f8517b5b/project-assignments", async (c) => {
  try {
    const body = await c.req.json();
    const assignments = await kv.get("project_assignments") || [];
    
    const newAssignment = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    assignments.push(newAssignment);
    await kv.set("project_assignments", assignments);
    
    console.log(`Project assignment created: ${newAssignment.id} - ${newAssignment.projectName}`);
    
    return c.json({ success: true, assignment: newAssignment }, 201);
  } catch (error) {
    console.error("Error creating project assignment:", error);
    return c.json({ error: "Failed to create project assignment", details: String(error) }, 500);
  }
});

// Update project assignment
app.put("/make-server-f8517b5b/project-assignments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    let assignments = await kv.get("project_assignments") || [];
    
    const index = assignments.findIndex((a: any) => a.id === id);
    if (index === -1) {
      return c.json({ error: "Project assignment not found" }, 404);
    }
    
    assignments[index] = { 
      ...assignments[index], 
      ...body, 
      id,
      createdAt: assignments[index].createdAt,
      lastUpdated: new Date().toISOString() 
    };
    
    await kv.set("project_assignments", assignments);
    
    console.log(`Project assignment updated: ${id} - ${assignments[index].projectName}`);
    
    return c.json({ success: true, assignment: assignments[index] });
  } catch (error) {
    console.error("Error updating project assignment:", error);
    return c.json({ error: "Failed to update project assignment" }, 500);
  }
});

// Delete project assignment
app.delete("/make-server-f8517b5b/project-assignments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    let assignments = await kv.get("project_assignments") || [];
    
    const beforeLength = assignments.length;
    assignments = assignments.filter((a: any) => a.id !== id);
    
    if (assignments.length === beforeLength) {
      return c.json({ error: "Project assignment not found" }, 404);
    }
    
    await kv.set("project_assignments", assignments);
    
    console.log(`Project assignment deleted: ${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting project assignment:", error);
    return c.json({ error: "Failed to delete project assignment" }, 500);
  }
});

// Get assignments for specific employee
app.get("/make-server-f8517b5b/project-assignments/employee/:employeeId", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const assignments = await kv.get("project_assignments") || [];
    const filtered = assignments.filter((a: any) => a.employeeId === employeeId);
    
    return c.json({ assignments: filtered });
  } catch (error) {
    console.error("Error fetching employee assignments:", error);
    return c.json({ error: "Failed to fetch employee assignments" }, 500);
  }
});

// Get assignments for specific client
app.get("/make-server-f8517b5b/project-assignments/client/:clientId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const assignments = await kv.get("project_assignments") || [];
    const filtered = assignments.filter((a: any) => a.clientId === clientId);
    
    return c.json({ assignments: filtered });
  } catch (error) {
    console.error("Error fetching client assignments:", error);
    return c.json({ error: "Failed to fetch client assignments" }, 500);
  }
});

// ============================================
// VENDOR MANAGEMENT ENDPOINTS
// ============================================

// Get all vendors
app.get("/make-server-f8517b5b/vendors", async (c) => {
  try {
    const vendors = await kv.getByPrefix("vendor:");
    return c.json({ vendors: vendors || [] });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return c.json({ error: "Failed to fetch vendors", details: String(error) }, 500);
  }
});

// Get single vendor
app.get("/make-server-f8517b5b/vendors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const vendor = await kv.get(`vendor:${id}`);
    
    if (!vendor) {
      return c.json({ error: "Vendor not found" }, 404);
    }
    
    return c.json({ vendor });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return c.json({ error: "Failed to fetch vendor", details: String(error) }, 500);
  }
});

// Get vendors by client
app.get("/make-server-f8517b5b/vendors/by-client/:clientId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const allVendors = await kv.getByPrefix("vendor:");
    const vendors = (allVendors || []).filter((v: any) => 
      v.clientIds && v.clientIds.includes(clientId)
    );
    return c.json({ vendors });
  } catch (error) {
    console.error("Error fetching vendors by client:", error);
    return c.json({ error: "Failed to fetch vendors", details: String(error) }, 500);
  }
});

// Create vendor
app.post("/make-server-f8517b5b/vendors", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.legalName || !body.companyName || !body.taxId) {
      return c.json({ error: "Missing required fields: legalName, companyName, taxId" }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newVendor = {
      id,
      ...body,
      status: body.status || 'Active',
      // Client assignment - vendors can work with multiple clients
      clientIds: body.clientIds || [],
      clientNames: body.clientNames || [],
      contacts: (body.contacts || []).map((c: any) => ({
        ...c,
        id: c.id || crypto.randomUUID(),
        vendorId: id,
        createdAt: now,
      })),
      compliance: body.compliance || {
        hasInsurance: false,
        hasW9: false,
        backgroundCheckRequired: false,
        hasMSA: false,
        complianceStatus: 'Pending Review',
      },
      documents: body.documents || [],
      subvendors: body.subvendors || [],
      subvendorCount: body.subvendorCount || 0,
      activeContractorCount: body.activeContractorCount || 0,
      activeProjects: body.activeProjects || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      hasComplianceIssues: body.hasComplianceIssues || false,
      hasExpiringDocs: body.hasExpiringDocs || false,
      createdBy: body.createdBy || 'system',
      createdAt: now,
    };

    await kv.set(`vendor:${id}`, newVendor);

    return c.json({ vendor: newVendor }, 201);
  } catch (error) {
    console.error("Error creating vendor:", error);
    return c.json({ error: "Failed to create vendor", details: String(error) }, 500);
  }
});

// Update vendor
app.put("/make-server-f8517b5b/vendors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingVendor = await kv.get(`vendor:${id}`);
    if (!existingVendor) {
      return c.json({ error: "Vendor not found" }, 404);
    }

    const now = new Date().toISOString();

    const updatedVendor = {
      ...existingVendor,
      ...body,
      contacts: (body.contacts || []).map((c: any) => ({
        ...c,
        id: c.id || crypto.randomUUID(),
        vendorId: id,
        updatedAt: now,
        createdAt: c.createdAt || now,
      })),
      id,
      createdAt: existingVendor.createdAt,
      updatedAt: now,
    };

    await kv.set(`vendor:${id}`, updatedVendor);

    return c.json({ vendor: updatedVendor });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return c.json({ error: "Failed to update vendor", details: String(error) }, 500);
  }
});

// Assign clients to vendor
app.post("/make-server-f8517b5b/vendors/:id/assign-clients", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const vendor = await kv.get(`vendor:${id}`);
    if (!vendor) {
      return c.json({ error: "Vendor not found" }, 404);
    }

    const now = new Date().toISOString();
    vendor.clientIds = body.clientIds || [];
    vendor.clientNames = body.clientNames || [];
    vendor.updatedAt = now;

    await kv.set(`vendor:${id}`, vendor);

    return c.json({ vendor });
  } catch (error) {
    console.error("Error assigning clients to vendor:", error);
    return c.json({ error: "Failed to assign clients", details: String(error) }, 500);
  }
});

// Delete vendor
app.delete("/make-server-f8517b5b/vendors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const vendor = await kv.get(`vendor:${id}`);
    if (!vendor) {
      return c.json({ error: "Vendor not found" }, 404);
    }

    await kv.del(`vendor:${id}`);

    return c.json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return c.json({ error: "Failed to delete vendor", details: String(error) }, 500);
  }
});

// ============================================
// SUBVENDOR MANAGEMENT ENDPOINTS
// ============================================

// Get all subvendors
app.get("/make-server-f8517b5b/subvendors", async (c) => {
  try {
    const allVendors = await kv.getByPrefix("vendor:");
    const subvendors = (allVendors || []).filter((v: any) => v.isSubvendor === true);
    return c.json({ subvendors });
  } catch (error) {
    console.error("Error fetching subvendors:", error);
    return c.json({ error: "Failed to fetch subvendors", details: String(error) }, 500);
  }
});

// Create subvendor
app.post("/make-server-f8517b5b/subvendors", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.parentVendorId || !body.legalName || !body.companyName) {
      return c.json({ 
        error: "Missing required fields: parentVendorId, legalName, companyName" 
      }, 400);
    }

    // Verify parent vendor exists
    const parentVendor = await kv.get(`vendor:${body.parentVendorId}`);
    if (!parentVendor) {
      return c.json({ error: "Parent vendor not found" }, 404);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newSubvendor = {
      id,
      ...body,
      isSubvendor: true,
      tier: body.tier || 1,
      status: body.status || 'Active',
      // Inherit client assignments from parent vendor by default, or use custom assignments
      clientIds: body.clientIds || parentVendor.clientIds || [],
      clientNames: body.clientNames || parentVendor.clientNames || [],
      contacts: [
        {
          id: crypto.randomUUID(),
          vendorId: id,
          name: body.name || '',
          email: body.email || '',
          phone: body.phone || '',
          contactType: 'Primary',
          isPrimary: true,
          createdAt: now,
        }
      ].filter(c => c.name || c.email),
      compliance: {
        hasInsurance: false,
        hasW9: false,
        backgroundCheckRequired: false,
        hasMSA: false,
        complianceStatus: 'Pending Review',
      },
      documents: [],
      subvendors: [],
      subvendorCount: 0,
      activeContractorCount: body.activeContractorCount || 0,
      activeProjects: body.activeProjects || 0,
      isActive: true,
      hasComplianceIssues: false,
      hasExpiringDocs: false,
      createdBy: body.createdBy || 'system',
      createdAt: now,
    };

    await kv.set(`vendor:${id}`, newSubvendor);

    // Update parent vendor's subvendor list
    parentVendor.subvendors = parentVendor.subvendors || [];
    if (!parentVendor.subvendors.includes(id)) {
      parentVendor.subvendors.push(id);
      parentVendor.subvendorCount = (parentVendor.subvendorCount || 0) + 1;
      await kv.set(`vendor:${body.parentVendorId}`, parentVendor);
    }

    return c.json({ subvendor: newSubvendor }, 201);
  } catch (error) {
    console.error("Error creating subvendor:", error);
    return c.json({ error: "Failed to create subvendor", details: String(error) }, 500);
  }
});

// Update subvendor
app.put("/make-server-f8517b5b/subvendors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingSubvendor = await kv.get(`vendor:${id}`);
    if (!existingSubvendor || !existingSubvendor.isSubvendor) {
      return c.json({ error: "Subvendor not found" }, 404);
    }

    const now = new Date().toISOString();

    const updatedSubvendor = {
      ...existingSubvendor,
      ...body,
      isSubvendor: true,
      id,
      createdAt: existingSubvendor.createdAt,
      updatedAt: now,
    };

    await kv.set(`vendor:${id}`, updatedSubvendor);

    return c.json({ subvendor: updatedSubvendor });
  } catch (error) {
    console.error("Error updating subvendor:", error);
    return c.json({ error: "Failed to update subvendor", details: String(error) }, 500);
  }
});

// ============================================
// CONTRACTOR MANAGEMENT ENDPOINTS
// ============================================

// Get all contractors
app.get("/make-server-f8517b5b/contractors", async (c) => {
  try {
    const contractors = await kv.getByPrefix("contractor:");
    return c.json({ contractors: contractors || [] });
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return c.json({ error: "Failed to fetch contractors", details: String(error) }, 500);
  }
});

// Get single contractor
app.get("/make-server-f8517b5b/contractors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const contractor = await kv.get(`contractor:${id}`);
    
    if (!contractor) {
      return c.json({ error: "Contractor not found" }, 404);
    }
    
    return c.json({ contractor });
  } catch (error) {
    console.error("Error fetching contractor:", error);
    return c.json({ error: "Failed to fetch contractor", details: String(error) }, 500);
  }
});

// Create contractor
app.post("/make-server-f8517b5b/contractors", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.firstName || !body.lastName || !body.email) {
      return c.json({ 
        error: "Missing required fields: firstName, lastName, email" 
      }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newContractor = {
      id,
      ...body,
      currentAssignments: body.currentAssignments || [],
      assignmentHistory: body.assignmentHistory || [],
      rateHistory: body.rateHistory || [],
      clientRatings: body.clientRatings || [],
      documents: body.documents || [],
      skills: body.skills || [],
      activeClientCount: body.activeClientCount || 0,
      activeProjectCount: body.activeProjectCount || 0,
      hasResume: body.hasResume || false,
      hasW9: body.hasW9 || false,
      hasI9: body.hasI9 || false,
      hasContract: body.hasContract || false,
      hasComplianceIssues: body.hasComplianceIssues || false,
      hasExpiringDocs: body.hasExpiringDocs || false,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isAvailableForNewAssignments: body.isAvailableForNewAssignments !== undefined 
        ? body.isAvailableForNewAssignments 
        : true,
      preferredForRehire: body.preferredForRehire !== undefined 
        ? body.preferredForRehire 
        : true,
      createdBy: body.createdBy || 'system',
      createdAt: now,
    };

    await kv.set(`contractor:${id}`, newContractor);

    // Update vendor contractor count if applicable
    if (body.vendorId) {
      const vendor = await kv.get(`vendor:${body.vendorId}`);
      if (vendor) {
        vendor.activeContractorCount = (vendor.activeContractorCount || 0) + 1;
        await kv.set(`vendor:${body.vendorId}`, vendor);
      }
    }

    return c.json({ contractor: newContractor }, 201);
  } catch (error) {
    console.error("Error creating contractor:", error);
    return c.json({ error: "Failed to create contractor", details: String(error) }, 500);
  }
});

// Update contractor
app.put("/make-server-f8517b5b/contractors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingContractor = await kv.get(`contractor:${id}`);
    if (!existingContractor) {
      return c.json({ error: "Contractor not found" }, 404);
    }

    const now = new Date().toISOString();

    const updatedContractor = {
      ...existingContractor,
      ...body,
      id,
      createdAt: existingContractor.createdAt,
      updatedAt: now,
    };

    await kv.set(`contractor:${id}`, updatedContractor);

    return c.json({ contractor: updatedContractor });
  } catch (error) {
    console.error("Error updating contractor:", error);
    return c.json({ error: "Failed to update contractor", details: String(error) }, 500);
  }
});

// Delete contractor
app.delete("/make-server-f8517b5b/contractors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const contractor = await kv.get(`contractor:${id}`);
    if (!contractor) {
      return c.json({ error: "Contractor not found" }, 404);
    }

    // Update vendor contractor count if applicable
    if (contractor.vendorId) {
      const vendor = await kv.get(`vendor:${contractor.vendorId}`);
      if (vendor && vendor.activeContractorCount > 0) {
        vendor.activeContractorCount--;
        await kv.set(`vendor:${contractor.vendorId}`, vendor);
      }
    }

    await kv.del(`contractor:${id}`);

    return c.json({ success: true, message: "Contractor deleted successfully" });
  } catch (error) {
    console.error("Error deleting contractor:", error);
    return c.json({ error: "Failed to delete contractor", details: String(error) }, 500);
  }
});

// Get contractors by vendor
app.get("/make-server-f8517b5b/vendors/:vendorId/contractors", async (c) => {
  try {
    const vendorId = c.req.param("vendorId");
    const allContractors = await kv.getByPrefix("contractor:");
    const vendorContractors = (allContractors || []).filter(
      (c: any) => c.vendorId === vendorId || c.subvendorId === vendorId
    );
    
    return c.json({ contractors: vendorContractors });
  } catch (error) {
    console.error("Error fetching vendor contractors:", error);
    return c.json({ error: "Failed to fetch vendor contractors", details: String(error) }, 500);
  }
});

// Assign contractor to project
app.post("/make-server-f8517b5b/contractors/:id/assignments", async (c) => {
  try {
    const contractorId = c.req.param("id");
    const body = await c.req.json();
    
    const contractor = await kv.get(`contractor:${contractorId}`);
    if (!contractor) {
      return c.json({ error: "Contractor not found" }, 404);
    }

    const assignmentId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newAssignment = {
      id: assignmentId,
      contractorId,
      ...body,
      status: body.status || 'Active',
      createdAt: now,
    };

    contractor.currentAssignments = contractor.currentAssignments || [];
    contractor.currentAssignments.push(newAssignment);
    contractor.activeClientCount = [...new Set(contractor.currentAssignments.map((a: any) => a.clientId))].length;
    contractor.activeProjectCount = contractor.currentAssignments.filter((a: any) => a.status === 'Active').length;
    contractor.status = 'On Assignment';

    await kv.set(`contractor:${contractorId}`, contractor);

    return c.json({ assignment: newAssignment, contractor }, 201);
  } catch (error) {
    console.error("Error creating contractor assignment:", error);
    return c.json({ error: "Failed to create assignment", details: String(error) }, 500);
  }
});

// ============================================
// DASHBOARD PREFERENCES ENDPOINTS
// ============================================

// Get user dashboard preferences
app.get("/make-server-f8517b5b/dashboard-preferences/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const preferences = await kv.get(`dashboard_prefs:${userId}`);
    
    // Return default preferences if none exist
    if (!preferences) {
      const defaultPreferences = {
        userId,
        sections: {
          quickActions: true,
          keyMetrics: true,
          additionalMetrics: true,
          workflowCharts: true,
        },
        keyMetrics: {
          totalEmployees: true,
          activeOnboarding: true,
          immigrationCases: true,
          criticalAlerts: true,
        },
        additionalMetrics: {
          activeClients: true,
          businessLicenses: true,
          pendingTimesheets: true,
          leaveRequests: true,
          activeOffboarding: true,
          pendingReviews: true,
          expiringDocuments: true,
          pendingSignatures: true,
        },
        updatedAt: new Date().toISOString(),
      };
      return c.json({ preferences: defaultPreferences });
    }
    
    return c.json({ preferences });
  } catch (error) {
    console.error("Error fetching dashboard preferences:", error);
    return c.json({ error: "Failed to fetch preferences", details: String(error) }, 500);
  }
});

// Save user dashboard preferences
app.post("/make-server-f8517b5b/dashboard-preferences", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.userId) {
      return c.json({ error: "Missing required field: userId" }, 400);
    }
    
    const now = new Date().toISOString();
    const preferences = {
      ...body,
      updatedAt: now,
    };
    
    await kv.set(`dashboard_prefs:${body.userId}`, preferences);
    
    console.log(`Dashboard preferences saved for user: ${body.userId}`);
    
    return c.json({ preferences, success: true });
  } catch (error) {
    console.error("Error saving dashboard preferences:", error);
    return c.json({ error: "Failed to save preferences", details: String(error) }, 500);
  }
});

// ============================================
// GENERIC KV STORE ENDPOINTS
// ============================================

// Get a value from KV store by key
app.get("/make-server-f8517b5b/kv/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const value = await kv.get(key);
    
    return c.json({ key, value: value || null });
  } catch (error) {
    console.error(`Error getting KV value for key ${c.req.param("key")}:`, error);
    return c.json({ error: "Failed to get value", details: String(error) }, 500);
  }
});

// Set a value in KV store
app.post("/make-server-f8517b5b/kv/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const body = await c.req.json();
    
    await kv.set(key, body.value);
    
    return c.json({ key, success: true, message: "Value saved successfully" });
  } catch (error) {
    console.error(`Error setting KV value for key ${c.req.param("key")}:`, error);
    return c.json({ error: "Failed to save value", details: String(error) }, 500);
  }
});

// Delete a value from KV store
app.delete("/make-server-f8517b5b/kv/:key", async (c) => {
  try {
    const key = c.req.param("key");
    await kv.del(key);
    
    return c.json({ key, success: true, message: "Value deleted successfully" });
  } catch (error) {
    console.error(`Error deleting KV value for key ${c.req.param("key")}:`, error);
    return c.json({ error: "Failed to delete value", details: String(error) }, 500);
  }
});

// ============================================
// TIMESHEET MANAGEMENT ENDPOINTS
// ============================================

// Get all timesheets
app.get("/make-server-f8517b5b/timesheets", async (c) => {
  try {
    const allTimesheets = await kv.getByPrefix("timesheet:");
    // Filter out timesheets that have already been invoiced
    const timesheets = (Array.isArray(allTimesheets) ? allTimesheets : []).filter((ts: any) => !ts.invoiced);
    return c.json({ timesheets });
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    return c.json({ error: "Failed to fetch timesheets", details: String(error) }, 500);
  }
});

// Get timesheet by ID
app.get("/make-server-f8517b5b/timesheets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const timesheet = await kv.get(`timesheet:${id}`);
    
    if (!timesheet) {
      return c.json({ error: "Timesheet not found" }, 404);
    }
    
    return c.json(timesheet);
  } catch (error) {
    console.error("Error fetching timesheet:", error);
    return c.json({ error: "Failed to fetch timesheet", details: String(error) }, 500);
  }
});

// Create timesheet (manual entry)
app.post("/make-server-f8517b5b/timesheets", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.employeeId || !body.employeeName) {
      return c.json({ error: "Missing required fields: employeeId, employeeName" }, 400);
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const regularHoursValue = body.regularHours || body.hours || 0;
    const overtimeHoursValue = body.overtimeHours || 0;
    const holidayHoursValue = body.holidayHours || 0;
    const timeOffHoursValue = body.timeOffHours || 0;
    const totalHoursValue = regularHoursValue + overtimeHoursValue + holidayHoursValue + timeOffHoursValue;
    
    // Look up billing rate from project assignment
    let billingRate = body.billingRate || 0;
    
    if (!billingRate && body.employeeId && (body.projectName || body.project)) {
      const assignments = await kv.get("project_assignments") || [];
      const projectName = body.projectName || body.project;
      const assignment = assignments.find((a: any) => 
        a.employeeId === body.employeeId && 
        a.projectName === projectName
      );
      
      if (assignment) {
        billingRate = assignment.billingRate || assignment.billableRate || assignment.rate || 0;
        console.log(`[Timesheet Create] Found billing rate for ${body.employeeName} on ${projectName}: $${billingRate}/hr`);
      } else {
        console.warn(`[Timesheet Create] No assignment found for ${body.employeeName} on ${projectName}`);
      }
    }
    
    const timesheet = {
      id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      date: body.date || now,
      // Support new field names (clientId, projectName, etc.) with fallback to old names
      clientId: body.clientId || "",
      clientName: body.clientName || body.client || "",
      projectName: body.projectName || body.project || "",
      poNumber: body.poNumber || "",
      // Keep old fields for backward compatibility
      project: body.projectName || body.project || "",
      client: body.clientName || body.client || "",
      hours: totalHoursValue,
      regularHours: regularHoursValue,
      overtimeHours: overtimeHoursValue,
      holidayHours: holidayHoursValue,
      timeOffHours: timeOffHoursValue,
      billingRate: billingRate,
      description: body.description || "",
      status: body.status || "draft",
      weekEnding: body.weekEnding || now,
      entryType: body.entryType || "manual",
      clientSigned: false,
      requiresApproval: true,
      clientTimesheetUrl: body.clientTimesheetUrl || "",
      createdAt: now,
      updatedAt: now,
      createdBy: body.createdBy || "system",
    };
    
    await kv.set(`timesheet:${id}`, timesheet);
    
    return c.json(timesheet, 201);
  } catch (error) {
    console.error("Error creating timesheet:", error);
    return c.json({ error: "Failed to create timesheet", details: String(error) }, 500);
  }
});

// Upload client timesheet document
app.post("/make-server-f8517b5b/upload-client-timesheet", async (c) => {
  try {
    console.log("📁 Client timesheet upload request received");
    
    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const employeeId = formData.get('employeeId') as string;
    const weekEnding = formData.get('weekEnding') as string;
    
    if (!file || !employeeId || !weekEnding) {
      return c.json({ error: "Missing required fields: file, employeeId, weekEnding" }, 400);
    }
    
    console.log(`Uploading client timesheet: ${file.name}, size: ${file.size}, employee: ${employeeId}, week: ${weekEnding}`);
    
    // Initialize Supabase client
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Create bucket if it doesn't exist
    const bucketName = 'make-f8517b5b-client-timesheets';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      if (createError) {
        console.error("Error creating bucket:", createError);
        return c.json({ error: "Failed to create storage bucket", details: String(createError) }, 500);
      }
    }
    
    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Upload file to storage
    const filePath = `${employeeId}/${weekEnding}/${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return c.json({ error: "Failed to upload file", details: String(uploadError) }, 500);
    }
    
    console.log(`✅ File uploaded successfully: ${filePath}`);
    
    // Create signed URL (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 31536000); // 1 year in seconds
    
    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return c.json({ error: "Failed to create signed URL", details: String(signedUrlError) }, 500);
    }
    
    return c.json({ 
      url: signedUrlData.signedUrl,
      filePath,
      fileName: file.name
    });
  } catch (error) {
    console.error("Error uploading client timesheet:", error);
    return c.json({ error: "Failed to upload client timesheet", details: String(error) }, 500);
  }
});

// Upload invoice for OCR processing
app.post("/make-server-f8517b5b/timesheets/upload", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.employeeId || !body.fileName) {
      return c.json({ error: "Missing required fields: employeeId, fileName" }, 400);
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Simulate OCR extraction (in production, this would call an OCR service)
    const extractedData = {
      employeeName: body.employeeName || "Extracted Name",
      client: body.client || "Client Name (OCR)",
      weekEnding: body.weekEnding || now,
      hours: body.hours || 40,
      approverName: body.approverName || "Manager Name",
      approverEmail: body.approverEmail || "manager@client.com",
      extractionConfidence: 0.95,
    };
    
    // Check if client-signed (if approver info is present)
    const isClientSigned = !!(extractedData.approverName && extractedData.approverEmail);
    
    const timesheet = {
      id,
      employeeId: body.employeeId,
      employeeName: extractedData.employeeName,
      date: now,
      project: body.project || "Auto-matched Project",
      client: extractedData.client,
      hours: extractedData.hours,
      description: `Imported from invoice: ${body.fileName}`,
      status: "pending_review", // Employee must review before submission
      weekEnding: extractedData.weekEnding,
      entryType: "invoice",
      invoiceFileName: body.fileName,
      invoiceFileUrl: body.fileUrl || "",
      clientSigned: isClientSigned,
      requiresApproval: !isClientSigned, // Skip approval if client-signed
      extractedData,
      ocrProcessed: true,
      ocrConfidence: extractedData.extractionConfidence,
      reviewedByEmployee: false,
      createdAt: now,
      updatedAt: now,
      createdBy: body.createdBy || "system",
    };
    
    // Try to match to existing project/PO
    try {
      const employees = await kv.getByPrefix("employee:");
      const employee = employees.find((emp: any) => emp.id === body.employeeId);
      
      if (employee && employee.projects && employee.projects.length > 0) {
        // Auto-match to first active project
        const activeProject = employee.projects.find((p: any) => p.status === "active");
        if (activeProject) {
          timesheet.project = activeProject.projectName;
          timesheet.client = activeProject.client;
          timesheet.autoMatched = true;
          timesheet.matchedToProjectId = activeProject.id;
        }
      }
    } catch (matchError) {
      console.log("Could not auto-match to project:", matchError);
    }
    
    await kv.set(`timesheet:${id}`, timesheet);
    
    return c.json(timesheet, 201);
  } catch (error) {
    console.error("Error uploading invoice:", error);
    return c.json({ error: "Failed to upload invoice", details: String(error) }, 500);
  }
});

// Review and confirm OCR-extracted timesheet
app.put("/make-server-f8517b5b/timesheets/:id/review", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const timesheet = await kv.get(`timesheet:${id}`);
    if (!timesheet) {
      return c.json({ error: "Timesheet not found" }, 404);
    }
    
    const now = new Date().toISOString();
    
    const updatedTimesheet = {
      ...timesheet,
      ...body.corrections, // Allow employee to correct any OCR errors
      reviewedByEmployee: true,
      reviewedAt: now,
      reviewedBy: body.reviewedBy || "employee",
      status: body.approved ? (timesheet.clientSigned ? "approved" : "submitted") : "draft",
      updatedAt: now,
    };
    
    await kv.set(`timesheet:${id}`, updatedTimesheet);
    
    return c.json(updatedTimesheet);
  } catch (error) {
    console.error("Error reviewing timesheet:", error);
    return c.json({ error: "Failed to review timesheet", details: String(error) }, 500);
  }
});

// API Integration endpoint (placeholder for Fieldglass, Beeline, Workday)
app.post("/make-server-f8517b5b/timesheets/import", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.source || !body.data) {
      return c.json({ error: "Missing required fields: source, data" }, 400);
    }
    
    const now = new Date().toISOString();
    const importedTimesheets = [];
    
    // Process each timesheet from external system
    for (const externalEntry of body.data) {
      const id = crypto.randomUUID();
      
      const timesheet = {
        id,
        employeeId: externalEntry.employeeId || body.employeeId,
        employeeName: externalEntry.employeeName || "Unknown",
        date: externalEntry.date || now,
        project: externalEntry.project || "",
        client: externalEntry.client || "",
        hours: externalEntry.hours || 0,
        description: externalEntry.description || `Imported from ${body.source}`,
        status: "approved", // Already approved in external system
        weekEnding: externalEntry.weekEnding || now,
        entryType: "api_import",
        importSource: body.source,
        externalId: externalEntry.id || null,
        clientSigned: true, // Assume external approvals are client-signed
        requiresApproval: false,
        createdAt: now,
        updatedAt: now,
        createdBy: `API:${body.source}`,
      };
      
      await kv.set(`timesheet:${id}`, timesheet);
      importedTimesheets.push(timesheet);
    }
    
    return c.json({ 
      success: true, 
      imported: importedTimesheets.length,
      timesheets: importedTimesheets 
    }, 201);
  } catch (error) {
    console.error("Error importing timesheets:", error);
    return c.json({ error: "Failed to import timesheets", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.2: EMPLOYEE ASSIGNMENTS & MULTI-PO SUPPORT
// ============================================

// Get all employee assignments
app.get("/make-server-f8517b5b/assignments", async (c) => {
  try {
    const assignments = await kv.getByPrefix("assignment:");
    return c.json(Array.isArray(assignments) ? assignments : []);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return c.json({ error: "Failed to fetch assignments", details: String(error) }, 500);
  }
});

// Get assignments for a specific employee
app.get("/make-server-f8517b5b/assignments/employee/:employeeId", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const assignments = await kv.getByPrefix("assignment:");
    const empAssignments = (assignments || []).filter((a: any) => a.employeeId === employeeId);
    return c.json(empAssignments);
  } catch (error) {
    console.error("Error fetching employee assignments:", error);
    return c.json({ error: "Failed to fetch employee assignments", details: String(error) }, 500);
  }
});

// Create new employee assignment with PO
app.post("/make-server-f8517b5b/assignments", async (c) => {
  try {
    const body = await c.req.json();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    const assignment = {
      id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      clientId: body.clientId,
      clientName: body.clientName,
      projectId: body.projectId,
      projectName: body.projectName,
      poNumber: body.poNumber,
      poLimit: body.poLimit || 0,
      poUtilized: 0,
      poRemaining: body.poLimit || 0,
      poStartDate: body.poStartDate,
      poEndDate: body.poEndDate,
      poStatus: "active",
      billingRate: body.billingRate || 0,
      billingType: body.billingType || "Hourly",
      workLocation: body.workLocation || "Remote",
      approvalWorkflowTemplate: body.approvalWorkflowTemplate || "default",
      clientApproverId: body.clientApproverId,
      clientApproverEmail: body.clientApproverEmail,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    
    await kv.set(`assignment:${id}`, assignment);
    return c.json(assignment, 201);
  } catch (error) {
    console.error("Error creating assignment:", error);
    return c.json({ error: "Failed to create assignment", details: String(error) }, 500);
  }
});

// Update assignment (e.g., update PO utilization)
app.put("/make-server-f8517b5b/assignments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const assignment = await kv.get(`assignment:${id}`);
    
    if (!assignment) {
      return c.json({ error: "Assignment not found" }, 404);
    }
    
    const updated = {
      ...assignment,
      ...body,
      poRemaining: (body.poLimit || assignment.poLimit) - (body.poUtilized || assignment.poUtilized),
      updatedAt: new Date().toISOString(),
    };
    
    // Update PO status based on utilization
    if (updated.poUtilized >= updated.poLimit) {
      updated.poStatus = "exceeded";
    } else if (new Date(updated.poEndDate) < new Date()) {
      updated.poStatus = "expired";
    } else if (updated.active) {
      updated.poStatus = "active";
    } else {
      updated.poStatus = "inactive";
    }
    
    await kv.set(`assignment:${id}`, updated);
    return c.json(updated);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return c.json({ error: "Failed to update assignment", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.3: APPROVAL WORKFLOW
// ============================================

// Get approval queue for a specific user/role
app.get("/make-server-f8517b5b/approvals/queue", async (c) => {
  try {
    const role = c.req.query("role"); // "client" or "accounting"
    const userId = c.req.query("userId");
    
    const timesheets = await kv.getByPrefix("timesheet:");
    const pending = (timesheets || []).filter((t: any) => {
      if (role === "client" && t.status === "pending_client_approval") return true;
      if (role === "accounting" && t.status === "pending_accounting_approval") return true;
      return false;
    });
    
    return c.json(pending);
  } catch (error) {
    console.error("Error fetching approval queue:", error);
    return c.json({ error: "Failed to fetch approval queue", details: String(error) }, 500);
  }
});

// Approve or reject timesheet
app.post("/make-server-f8517b5b/timesheets/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const timesheet = await kv.get(`timesheet:${id}`);
    if (!timesheet) {
      return c.json({ error: "Timesheet not found" }, 404);
    }
    
    // Get or create approval workflow
    let workflow = timesheet.approvalWorkflow;
    if (!workflow) {
      workflow = {
        id: crypto.randomUUID(),
        timesheetId: id,
        currentStage: 1,
        totalStages: 3,
        stages: [
          { stage: 1, name: "employee", status: "approved", required: true },
          { stage: 2, name: "client", status: "pending", required: !timesheet.clientSigned, approverEmail: body.approverEmail },
          { stage: 3, name: "accounting", status: "pending", required: true },
        ],
        history: [],
        completed: false,
        createdAt: now,
      };
    }
    
    const action = body.approved ? "approved" : "rejected";
    const currentStage = workflow.stages.find((s: any) => s.stage === workflow.currentStage);
    
    if (currentStage) {
      currentStage.status = action;
      currentStage.approverId = body.approverId;
      currentStage.approverName = body.approverName;
    }
    
    // Add to history
    workflow.history.push({
      id: crypto.randomUUID(),
      timesheetId: id,
      workflowId: workflow.id,
      stage: workflow.currentStage,
      stageName: currentStage?.name || "unknown",
      action,
      performedBy: body.approverId || "unknown",
      performedByName: body.approverName || "Unknown User",
      performedByRole: body.role || "unknown",
      comments: body.comments,
      timestamp: now,
    });
    
    let newStatus = timesheet.status;
    
    if (action === "rejected") {
      newStatus = "rejected";
      timesheet.rejectedAt = now;
      workflow.completed = true;
    } else {
      // Move to next stage
      workflow.currentStage++;
      
      if (workflow.currentStage === 2 && timesheet.clientSigned) {
        // Skip client approval if client-signed
        workflow.currentStage = 3;
        workflow.stages[1].status = "skipped";
      }
      
      if (workflow.currentStage === 2) {
        newStatus = "pending_client_approval";
      } else if (workflow.currentStage === 3) {
        newStatus = "pending_accounting_approval";
      } else if (workflow.currentStage > workflow.totalStages) {
        newStatus = "approved";
        timesheet.approvedAt = now;
        workflow.completed = true;
        workflow.completedAt = now;
      }
    }
    
    timesheet.status = newStatus;
    timesheet.approvalWorkflow = workflow;
    timesheet.updatedAt = now;
    
    await kv.set(`timesheet:${id}`, timesheet);
    
    // Create notification for next approver or employee
    const notifId = crypto.randomUUID();
    const notification = {
      id: notifId,
      userId: action === "approved" && workflow.currentStage <= workflow.totalStages 
        ? "next-approver" 
        : timesheet.employeeId,
      userEmail: "",
      userName: "",
      type: action === "approved" ? "approval" : "alert",
      category: "timesheet",
      title: action === "approved" ? "Timesheet Approved" : "Timesheet Rejected",
      message: action === "approved" 
        ? `Timesheet for ${timesheet.weekEnding} has been approved by ${body.approverName}` 
        : `Timesheet for ${timesheet.weekEnding} was rejected. Reason: ${body.comments || "No reason provided"}`,
      priority: action === "rejected" ? "high" : "medium",
      channels: ["email", "in_app"],
      emailSent: false,
      smsSent: false,
      read: false,
      relatedEntityId: id,
      relatedEntityType: "timesheet",
      createdAt: now,
    };
    
    await kv.set(`notification:${notifId}`, notification);
    
    // AUTO-GENERATE INVOICE if timesheet is fully approved
    if (newStatus === "approved" && !timesheet.invoiced) {
      console.log(`[Invoice Auto-Gen] Timesheet ${id} approved, checking if invoice should be auto-generated...`);
      
      // Get client configuration for auto-invoice settings
      const client = await kv.get(`client:${timesheet.clientId}`);
      
      if (client && client.autoGenerateInvoices) {
        console.log(`[Invoice Auto-Gen] Client ${client.companyName} has auto-generate enabled`);
        
        // Determine invoice period based on client settings
        const invoicePeriod = client.invoicePeriod || "semi-monthly"; // monthly, semi-monthly, weekly, bi-weekly
        
        // Calculate period dates based on timesheet week ending
        const weekEndDate = new Date(timesheet.weekEnding);
        let periodStart: Date;
        let periodEnd: Date;
        
        if (invoicePeriod === "semi-monthly") {
          const dayOfMonth = weekEndDate.getDate();
          if (dayOfMonth <= 15) {
            periodStart = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth(), 1);
            periodEnd = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth(), 15);
          } else {
            periodStart = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth(), 16);
            periodEnd = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth() + 1, 0);
          }
        } else if (invoicePeriod === "monthly") {
          periodStart = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth(), 1);
          periodEnd = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth() + 1, 0);
        } else {
          // For weekly/bi-weekly, use the week ending as the period
          periodStart = new Date(weekEndDate);
          periodStart.setDate(periodStart.getDate() - 6);
          periodEnd = weekEndDate;
        }
        
        // Create unique invoice key based on Client-PO-Period
        const poNumber = timesheet.poNumber || "NO-PO";
        const periodKey = `${periodStart.toISOString().split('T')[0]}_${periodEnd.toISOString().split('T')[0]}`;
        const invoiceKey = `autoinvoice:${timesheet.clientId}:${poNumber}:${periodKey}`;
        
        console.log(`[Invoice Auto-Gen] Checking for existing invoice with key: ${invoiceKey}`);
        
        // Check if invoice already exists for this Client-PO-Period combination
        let existingInvoice = await kv.get(invoiceKey);
        
        if (existingInvoice) {
          console.log(`[Invoice Auto-Gen] Found existing invoice ${existingInvoice.invoiceNumber}, adding timesheet to it`);
          // Add this timesheet to existing invoice - will be recalculated when invoice is finalized
          existingInvoice.pendingTimesheetIds = existingInvoice.pendingTimesheetIds || [];
          existingInvoice.pendingTimesheetIds.push(id);
          await kv.set(invoiceKey, existingInvoice);
          await kv.set(`invoice:${existingInvoice.id}`, existingInvoice);
          
          // Mark timesheet with pending invoice
          timesheet.pendingInvoiceId = existingInvoice.id;
          await kv.set(`timesheet:${id}`, timesheet);
        } else {
          console.log(`[Invoice Auto-Gen] Creating new auto-generated invoice for period ${periodKey}`);
          
          // Create new invoice
          const invoiceId = crypto.randomUUID();
          const allInvoices = await kv.getByPrefix("invoice:");
          const invoiceNumber = `INV-${String((allInvoices?.length || 0) + 1).padStart(6, "0")}`;
          
          const newInvoice = {
            id: invoiceId,
            invoiceNumber,
            clientId: timesheet.clientId,
            clientName: timesheet.clientName || client.companyName,
            poId: timesheet.clientPoId,
            poNumber: timesheet.poNumber,
            period: {
              startDate: periodStart.toISOString(),
              endDate: periodEnd.toISOString(),
              type: invoicePeriod,
            },
            lineItems: [], // Will be calculated when invoice is finalized
            subtotal: 0,
            taxAmount: 0,
            taxRate: client.taxRate || 0,
            reimbursements: 0,
            total: 0,
            status: "auto-draft", // Special status for auto-generated invoices
            pendingTimesheetIds: [id],
            timesheetIds: [],
            expenseIds: [],
            generatedAt: now,
            generatedBy: "Auto-Generation System",
            autoGenerated: true,
            dueDate: new Date(Date.now() + (client.paymentTermsDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
            notes: client.invoiceNotes || "",
            terms: client.paymentTerms || "Net 30",
            manuallyEdited: false,
            createdAt: now,
            updatedAt: now,
          };
          
          await kv.set(invoiceKey, newInvoice);
          await kv.set(`invoice:${invoiceId}`, newInvoice);
          
          // Mark timesheet with pending invoice
          timesheet.pendingInvoiceId = invoiceId;
          await kv.set(`timesheet:${id}`, timesheet);
          
          console.log(`[Invoice Auto-Gen] Created invoice ${invoiceNumber} for Client ${client.companyName}, PO ${poNumber}, Period ${periodKey}`);
        }
      }
    }
    
    return c.json({ timesheet, notification });
  } catch (error) {
    console.error("Error approving timesheet:", error);
    return c.json({ error: "Failed to approve timesheet", details: String(error) }, 500);
  }
});

// Delegate approval to another user
app.post("/make-server-f8517b5b/approvals/:id/delegate", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const timesheet = await kv.get(`timesheet:${id}`);
    if (!timesheet || !timesheet.approvalWorkflow) {
      return c.json({ error: "Timesheet or workflow not found" }, 404);
    }
    
    const currentStage = timesheet.approvalWorkflow.stages.find(
      (s: any) => s.stage === timesheet.approvalWorkflow.currentStage
    );
    
    if (currentStage) {
      currentStage.delegatedTo = body.delegatedToId;
      currentStage.delegatedToName = body.delegatedToName;
    }
    
    await kv.set(`timesheet:${id}`, timesheet);
    return c.json(timesheet);
  } catch (error) {
    console.error("Error delegating approval:", error);
    return c.json({ error: "Failed to delegate approval", details: String(error) }, 500);
  }
});

// Update/Edit timesheet
app.put("/make-server-f8517b5b/timesheets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const timesheet = await kv.get(`timesheet:${id}`);
    if (!timesheet) {
      return c.json({ error: "Timesheet not found" }, 404);
    }
    
    // Only allow editing if not approved
    if (timesheet.status === "approved") {
      return c.json({ error: "Cannot edit approved timesheets" }, 403);
    }
    
    const now = new Date().toISOString();
    
    // Update fields
    const regularHours = body.regularHours !== undefined ? body.regularHours : (body.hours !== undefined ? body.hours : timesheet.regularHours || timesheet.hours);
    const overtimeHours = body.overtimeHours !== undefined ? body.overtimeHours : (timesheet.overtimeHours || 0);
    const holidayHours = body.holidayHours !== undefined ? body.holidayHours : (timesheet.holidayHours || 0);
    const timeOffHours = body.timeOffHours !== undefined ? body.timeOffHours : (timesheet.timeOffHours || 0);
    const totalHours = regularHours + overtimeHours + holidayHours + timeOffHours;
    
    const updatedTimesheet = {
      ...timesheet,
      date: body.date || timesheet.date,
      // Support new field names with fallback to old names
      clientId: body.clientId || timesheet.clientId || "",
      clientName: body.clientName || body.client || timesheet.clientName || timesheet.client || "",
      projectName: body.projectName || body.project || timesheet.projectName || timesheet.project || "",
      poNumber: body.poNumber || timesheet.poNumber || "",
      // Keep old fields for backward compatibility
      project: body.projectName || body.project || timesheet.project || "",
      client: body.clientName || body.client || timesheet.client || "",
      hours: totalHours,
      regularHours: regularHours,
      overtimeHours: overtimeHours,
      holidayHours: holidayHours,
      timeOffHours: timeOffHours,
      description: body.description !== undefined ? body.description : timesheet.description,
      weekEnding: body.weekEnding || timesheet.weekEnding,
      status: body.status || timesheet.status,
      rejectionComment: body.rejectionComment || timesheet.rejectionComment || "",
      rejectedAt: body.rejectedAt || timesheet.rejectedAt || null,
      clientTimesheetUrl: body.clientTimesheetUrl || timesheet.clientTimesheetUrl || "",
      updatedAt: now,
    };
    
    await kv.set(`timesheet:${id}`, updatedTimesheet);
    
    return c.json(updatedTimesheet);
  } catch (error) {
    console.error("Error updating timesheet:", error);
    return c.json({ error: "Failed to update timesheet", details: String(error) }, 500);
  }
});

// Delete timesheet
app.delete("/make-server-f8517b5b/timesheets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    console.log(`[Timesheet Delete] Attempting to delete timesheet with ID: ${id}`);
    console.log(`[Timesheet Delete] Looking up key: timesheet:${id}`);
    
    const timesheet = await kv.get(`timesheet:${id}`);
    
    if (!timesheet) {
      console.error(`[Timesheet Delete] Timesheet not found for ID: ${id}`);
      
      // List all timesheets to help debug
      const allTimesheets = await kv.getByPrefix("timesheet:");
      console.log(`[Timesheet Delete] Total timesheets in database: ${allTimesheets?.length || 0}`);
      if (allTimesheets && allTimesheets.length > 0) {
        console.log(`[Timesheet Delete] Sample IDs:`, allTimesheets.slice(0, 5).map((t: any) => t.id));
      }
      
      return c.json({ error: "Timesheet not found" }, 404);
    }
    
    // Log deletion for audit trail
    console.log(`[Timesheet Delete] Found timesheet - Status: ${timesheet.status}, Employee: ${timesheet.employeeName}`);
    console.log(`[Timesheet Delete] Deleting timesheet ${id}`);
    
    await kv.del(`timesheet:${id}`);
    
    console.log(`[Timesheet Delete] Successfully deleted timesheet ${id}`);
    
    return c.json({ success: true, message: "Timesheet deleted successfully" });
  } catch (error) {
    console.error("Error deleting timesheet:", error);
    return c.json({ error: "Failed to delete timesheet", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.4: OVERTIME & EXCEPTION HANDLING
// ============================================

// Get all exceptions
app.get("/make-server-f8517b5b/exceptions", async (c) => {
  try {
    const exceptions = await kv.getByPrefix("exception:");
    return c.json(Array.isArray(exceptions) ? exceptions : []);
  } catch (error) {
    console.error("Error fetching exceptions:", error);
    return c.json({ error: "Failed to fetch exceptions", details: String(error) }, 500);
  }
});

// Create exception
app.post("/make-server-f8517b5b/exceptions", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const exception = {
      id,
      timesheetId: body.timesheetId,
      type: body.type,
      severity: body.severity || "warning",
      message: body.message,
      createdAt: now,
    };
    
    await kv.set(`exception:${id}`, exception);
    
    // Also add to timesheet
    const timesheet = await kv.get(`timesheet:${body.timesheetId}`);
    if (timesheet) {
      if (!timesheet.exceptions) timesheet.exceptions = [];
      timesheet.exceptions.push(exception);
      timesheet.hasExceptions = true;
      await kv.set(`timesheet:${body.timesheetId}`, timesheet);
    }
    
    return c.json(exception, 201);
  } catch (error) {
    console.error("Error creating exception:", error);
    return c.json({ error: "Failed to create exception", details: String(error) }, 500);
  }
});

// Resolve exception
app.put("/make-server-f8517b5b/exceptions/:id/resolve", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const exception = await kv.get(`exception:${id}`);
    if (!exception) {
      return c.json({ error: "Exception not found" }, 404);
    }
    
    exception.resolvedAt = now;
    exception.resolvedBy = body.resolvedBy;
    exception.resolutionNotes = body.notes;
    
    await kv.set(`exception:${id}`, exception);
    return c.json(exception);
  } catch (error) {
    console.error("Error resolving exception:", error);
    return c.json({ error: "Failed to resolve exception", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.5: INVOICING INTEGRATION
// ============================================

// Get all invoices
app.get("/make-server-f8517b5b/invoices", async (c) => {
  try {
    const invoices = await kv.getByPrefix("invoice:");
    return c.json(Array.isArray(invoices) ? invoices : []);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return c.json({ error: "Failed to fetch invoices", details: String(error) }, 500);
  }
});

// Generate invoice number (MUST be before /invoices/:id to avoid route collision)
app.get("/make-server-f8517b5b/invoices/generate-number", async (c) => {
  try {
    const allInvoices = await kv.getByPrefix("invoice:");
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}`;
    
    // Find the highest number for this month
    const monthInvoices = (allInvoices || []).filter((inv: any) => 
      inv.invoiceNumber?.startsWith(prefix)
    );
    
    let nextNumber = 1;
    if (monthInvoices.length > 0) {
      const numbers = monthInvoices.map((inv: any) => {
        const match = inv.invoiceNumber?.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextNumber = Math.max(...numbers) + 1;
    }
    
    const invoiceNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
    
    return c.json({ invoiceNumber });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return c.json({ error: "Failed to generate invoice number", details: String(error) }, 500);
  }
});

// Get single invoice
app.get("/make-server-f8517b5b/invoices/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const invoice = await kv.get(`invoice:${id}`);
    
    if (!invoice) {
      return c.json({ error: "Invoice not found" }, 404);
    }
    
    return c.json({ invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return c.json({ error: "Failed to fetch invoice", details: String(error) }, 500);
  }
});

// Generate invoice from approved timesheets
app.post("/make-server-f8517b5b/invoices/generate", async (c) => {
  try {
    const body = await c.req.json();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    // Get timesheets for this client/period
    const allTimesheets = await kv.getByPrefix("timesheet:");
    const timesheets = (allTimesheets || []).filter((t: any) => 
      t.clientId === body.clientId &&
      t.status === "approved" &&
      !t.invoiced &&
      new Date(t.date) >= new Date(body.period.startDate) &&
      new Date(t.date) <= new Date(body.period.endDate)
    );
    
    // Calculate line items
    const lineItems = [];
    let subtotal = 0;
    
    for (const ts of timesheets) {
      const rate = ts.billingRate || 0;
      const regularAmount = (ts.regularHours || ts.hours || 0) * rate;
      const overtimeAmount = (ts.overtimeHours || 0) * rate * (ts.overtimeRate || 1.5);
      
      if ((ts.regularHours || ts.hours) > 0) {
        lineItems.push({
          id: crypto.randomUUID(),
          invoiceId: id,
          type: "timesheet",
          description: `${ts.employeeName} - ${ts.project} (${ts.date})`,
          quantity: ts.regularHours || ts.hours || 0,
          rate,
          amount: regularAmount,
          timesheetId: ts.id,
          taxable: true,
          billable: true,
        });
        subtotal += regularAmount;
      }
      
      if (ts.overtimeHours > 0) {
        lineItems.push({
          id: crypto.randomUUID(),
          invoiceId: id,
          type: "timesheet",
          description: `${ts.employeeName} - ${ts.project} (${ts.date}) - Overtime`,
          quantity: ts.overtimeHours,
          rate: rate * (ts.overtimeRate || 1.5),
          amount: overtimeAmount,
          timesheetId: ts.id,
          taxable: true,
          billable: true,
        });
        subtotal += overtimeAmount;
      }
    }
    
    // Get expenses if any
    const allExpenses = await kv.getByPrefix("expense:");
    const expenses = (allExpenses || []).filter((e: any) =>
      e.clientId === body.clientId &&
      e.status === "approved" &&
      e.billableToClient &&
      !e.invoiceId &&
      new Date(e.date) >= new Date(body.period.startDate) &&
      new Date(e.date) <= new Date(body.period.endDate)
    );
    
    for (const exp of expenses) {
      lineItems.push({
        id: crypto.randomUUID(),
        invoiceId: id,
        type: "expense",
        description: `${exp.category} - ${exp.description}`,
        quantity: 1,
        rate: exp.amount,
        amount: exp.amount,
        expenseId: exp.id,
        taxable: false,
        billable: true,
      });
      subtotal += exp.amount;
    }
    
    const taxRate = body.taxRate || 0;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    // Use provided invoice number or generate one
    let invoiceNumber = body.invoiceNumber;
    if (!invoiceNumber) {
      const allInvoices = await kv.getByPrefix("invoice:");
      invoiceNumber = `INV-${String((allInvoices?.length || 0) + 1).padStart(6, "0")}`;
    }
    
    const invoice = {
      id,
      invoiceNumber,
      clientId: body.clientId,
      clientName: body.clientName,
      poId: body.poId,
      poNumber: body.poNumber,
      period: body.period,
      lineItems,
      subtotal,
      taxAmount,
      taxRate,
      total,
      status: "draft",
      timesheetIds: timesheets.map((t: any) => t.id),
      expenseIds: expenses.map((e: any) => e.id),
      generatedAt: now,
      generatedBy: body.generatedBy || "System",
      dueDate: body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: body.notes,
      terms: body.terms || "Net 30",
      manuallyEdited: false,
      createdAt: now,
      updatedAt: now,
    };
    
    await kv.set(`invoice:${id}`, invoice);
    
    // Mark timesheets as invoiced
    for (const ts of timesheets) {
      ts.invoiced = true;
      ts.invoiceId = id;
      ts.invoicedAt = now;
      await kv.set(`timesheet:${ts.id}`, ts);
    }
    
    // Mark expenses as invoiced
    for (const exp of expenses) {
      exp.invoiceId = id;
      await kv.set(`expense:${exp.id}`, exp);
    }
    
    return c.json(invoice, 201);
  } catch (error) {
    console.error("Error generating invoice:", error);
    return c.json({ error: "Failed to generate invoice", details: String(error) }, 500);
  }
});

// Finalize auto-generated invoice (calculate line items from pending timesheets)
app.post("/make-server-f8517b5b/invoices/:id/finalize", async (c) => {
  try {
    const id = c.req.param("id");
    const now = new Date().toISOString();
    
    const invoice = await kv.get(`invoice:${id}`);
    if (!invoice) {
      return c.json({ error: "Invoice not found" }, 404);
    }
    
    if (!invoice.autoGenerated) {
      return c.json({ error: "Only auto-generated invoices can be finalized" }, 400);
    }
    
    console.log(`[Invoice Finalize] Finalizing invoice ${invoice.invoiceNumber}`);
    
    // Get all pending timesheets
    const pendingIds = invoice.pendingTimesheetIds || [];
    const timesheets = [];
    for (const tsId of pendingIds) {
      const ts = await kv.get(`timesheet:${tsId}`);
      if (ts && ts.status === "approved") {
        timesheets.push(ts);
      }
    }
    
    console.log(`[Invoice Finalize] Found ${timesheets.length} approved timesheets to include`);
    
    // Calculate line items grouped by employee and project
    const lineItems = [];
    let subtotal = 0;
    let reimbursements = 0;
    
    // Group by employee-project for cleaner line items
    const grouped: any = {};
    for (const ts of timesheets) {
      const key = `${ts.employeeId}-${ts.projectName || ts.project}`;
      if (!grouped[key]) {
        grouped[key] = {
          employeeName: ts.employeeName,
          projectName: ts.projectName || ts.project,
          regularHours: 0,
          overtimeHours: 0,
          rate: ts.billingRate || 0,
          timesheetIds: []
        };
      }
      grouped[key].regularHours += ts.regularHours || ts.hours || 0;
      grouped[key].overtimeHours += ts.overtimeHours || 0;
      grouped[key].timesheetIds.push(ts.id);
    }
    
    // Create line items from grouped data
    for (const key in grouped) {
      const g = grouped[key];
      
      if (g.regularHours > 0) {
        const regularAmount = g.regularHours * g.rate;
        lineItems.push({
          id: crypto.randomUUID(),
          invoiceId: id,
          type: "timesheet",
          description: `${g.employeeName} - ${g.projectName} (Regular Hours)`,
          quantity: g.regularHours,
          rate: g.rate,
          amount: regularAmount,
          timesheetIds: g.timesheetIds,
          taxable: true,
          billable: true,
        });
        subtotal += regularAmount;
      }
      
      if (g.overtimeHours > 0) {
        const overtimeRate = g.rate * 1.5;
        const overtimeAmount = g.overtimeHours * overtimeRate;
        lineItems.push({
          id: crypto.randomUUID(),
          invoiceId: id,
          type: "timesheet",
          description: `${g.employeeName} - ${g.projectName} (Overtime)`,
          quantity: g.overtimeHours,
          rate: overtimeRate,
          amount: overtimeAmount,
          timesheetIds: g.timesheetIds,
          taxable: true,
          billable: true,
        });
        subtotal += overtimeAmount;
      }
    }
    
    // Get expenses/reimbursements for the same period
    const allExpenses = await kv.getByPrefix("expense:");
    const expenses = (allExpenses || []).filter((e: any) =>
      e.clientId === invoice.clientId &&
      e.status === "approved" &&
      e.billableToClient &&
      !e.invoiceId &&
      new Date(e.date) >= new Date(invoice.period.startDate) &&
      new Date(e.date) <= new Date(invoice.period.endDate)
    );
    
    console.log(`[Invoice Finalize] Found ${expenses.length} reimbursable expenses`);
    
    for (const exp of expenses) {
      lineItems.push({
        id: crypto.randomUUID(),
        invoiceId: id,
        type: "reimbursement",
        description: `Reimbursement: ${exp.category} - ${exp.description}`,
        quantity: 1,
        rate: exp.amount,
        amount: exp.amount,
        expenseId: exp.id,
        taxable: false, // Reimbursements typically not taxable
        billable: true,
      });
      reimbursements += exp.amount;
    }
    
    // Calculate tax based on client settings (tax only on hours, not reimbursements)
    const taxableAmount = subtotal; // Only hours are taxable
    const taxAmount = taxableAmount * invoice.taxRate;
    const total = subtotal + reimbursements + taxAmount;
    
    // Update invoice
    invoice.lineItems = lineItems;
    invoice.subtotal = subtotal;
    invoice.reimbursements = reimbursements;
    invoice.taxAmount = taxAmount;
    invoice.total = total;
    invoice.status = "draft"; // Change from auto-draft to draft
    invoice.timesheetIds = timesheets.map((t: any) => t.id);
    invoice.expenseIds = expenses.map((e: any) => e.id);
    invoice.pendingTimesheetIds = []; // Clear pending
    invoice.finalizedAt = now;
    invoice.updatedAt = now;
    
    await kv.set(`invoice:${id}`, invoice);
    
    // Mark timesheets as invoiced
    for (const ts of timesheets) {
      ts.invoiced = true;
      ts.invoiceId = id;
      ts.invoicedAt = now;
      ts.pendingInvoiceId = undefined;
      await kv.set(`timesheet:${ts.id}`, ts);
    }
    
    // Mark expenses as invoiced
    for (const exp of expenses) {
      exp.invoiceId = id;
      await kv.set(`expense:${exp.id}`, exp);
    }
    
    console.log(`[Invoice Finalize] Invoice ${invoice.invoiceNumber} finalized: $${subtotal} + $${reimbursements} reimbursements + $${taxAmount} tax = $${total}`);
    
    return c.json(invoice);
  } catch (error) {
    console.error("Error finalizing invoice:", error);
    return c.json({ error: "Failed to finalize invoice", details: String(error) }, 500);
  }
});

// Create new invoice (manual creation)
app.post("/make-server-f8517b5b/invoices", async (c) => {
  try {
    const body = await c.req.json();
    const now = new Date().toISOString();
    const id = body.id || crypto.randomUUID();
    
    console.log(`[Invoice Create] Creating new invoice ${body.invoiceNumber}`);
    
    const invoice = {
      id,
      invoiceNumber: body.invoiceNumber,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      billTo: body.billTo,
      poNumber: body.poNumber,
      lineItems: body.lineItems || [],
      subtotal: body.subtotal || 0,
      taxAmount: body.taxAmount || 0,
      total: body.total || 0,
      notes: body.notes || '',
      terms: body.terms || '',
      status: body.status || 'draft',
      companyInfo: body.companyInfo || {},
      timesheetIds: body.timesheetIds || [],
      autoGenerated: false,
      manuallyEdited: false,
      createdAt: now,
      updatedAt: now,
    };
    
    await kv.set(`invoice:${id}`, invoice);
    
    // Mark associated timesheets as invoiced
    if (body.timesheetIds && body.timesheetIds.length > 0) {
      for (const timesheetId of body.timesheetIds) {
        const timesheet = await kv.get(`timesheet:${timesheetId}`);
        if (timesheet) {
          timesheet.invoiced = true;
          timesheet.invoiceId = id;
          timesheet.invoicedAt = now;
          await kv.set(`timesheet:${timesheetId}`, timesheet);
        }
      }
      console.log(`[Invoice Create] Marked ${body.timesheetIds.length} timesheet(s) as invoiced`);
    }
    
    console.log(`[Invoice Create] Invoice ${invoice.invoiceNumber} created successfully`);
    
    return c.json(invoice, 201);
  } catch (error) {
    console.error("[Invoice Create] Error creating invoice:", error);
    return c.json({ error: "Failed to create invoice", details: String(error) }, 500);
  }
});

// Update invoice (manual override)
app.put("/make-server-f8517b5b/invoices/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const invoice = await kv.get(`invoice:${id}`);
    if (!invoice) {
      return c.json({ error: "Invoice not found" }, 404);
    }
    
    const updated = {
      ...invoice,
      ...body,
      manuallyEdited: true,
      editedBy: body.editedBy,
      editedAt: now,
      updatedAt: now,
    };
    
    await kv.set(`invoice:${id}`, updated);
    
    // Mark associated timesheets as invoiced
    if (body.timesheetIds && body.timesheetIds.length > 0) {
      for (const timesheetId of body.timesheetIds) {
        const timesheet = await kv.get(`timesheet:${timesheetId}`);
        if (timesheet) {
          timesheet.invoiced = true;
          timesheet.invoiceId = id;
          timesheet.invoicedAt = now;
          await kv.set(`timesheet:${timesheetId}`, timesheet);
        }
      }
      console.log(`[Invoice Update] Marked ${body.timesheetIds.length} timesheet(s) as invoiced`);
    }
    
    return c.json(updated);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return c.json({ error: "Failed to update invoice", details: String(error) }, 500);
  }
});

// Delete invoice
app.delete("/make-server-f8517b5b/invoices/:id", async (c) => {
  try {
    const id = c.req.param("id");
    console.log(`[Invoice Delete] Attempting to delete invoice: ${id}`);
    
    const invoice = await kv.get(`invoice:${id}`);
    if (!invoice) {
      console.error(`[Invoice Delete] Invoice not found: ${id}`);
      return c.json({ error: "Invoice not found" }, 404);
    }
    
    console.log(`[Invoice Delete] Found invoice ${invoice.invoiceNumber}, unmarking timesheets...`);
    
    // If invoice had timesheets, un-mark them as invoiced
    if (invoice.lineItems && invoice.lineItems.length > 0) {
      for (const lineItem of invoice.lineItems) {
        if (lineItem.timesheetId) {
          try {
            const timesheet = await kv.get(`timesheet:${lineItem.timesheetId}`);
            if (timesheet) {
              timesheet.invoiced = false;
              timesheet.invoiceId = undefined;
              timesheet.invoicedAt = undefined;
              timesheet.pendingInvoiceId = undefined;
              await kv.set(`timesheet:${lineItem.timesheetId}`, timesheet);
              console.log(`[Invoice Delete] Unmarked timesheet ${lineItem.timesheetId}`);
            }
          } catch (tsError) {
            console.error(`[Invoice Delete] Error unmarking timesheet ${lineItem.timesheetId}:`, tsError);
            // Continue with deletion even if timesheet update fails
          }
        }
      }
    }
    
    // Delete the invoice
    console.log(`[Invoice Delete] Deleting invoice from database...`);
    await kv.del(`invoice:${id}`);
    
    console.log(`[Invoice Delete] Successfully deleted invoice ${invoice.invoiceNumber} - Status: ${invoice.status}`);
    
    return c.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("[Invoice Delete] Error deleting invoice:", error);
    console.error("[Invoice Delete] Error details:", error.message || String(error));
    return c.json({ error: "Failed to delete invoice", details: error.message || String(error) }, 500);
  }
});

// Send invoice to client
app.post("/make-server-f8517b5b/invoices/:id/send", async (c) => {
  try {
    const id = c.req.param("id");
    const now = new Date().toISOString();
    
    const invoice = await kv.get(`invoice:${id}`);
    if (!invoice) {
      return c.json({ error: "Invoice not found" }, 404);
    }
    
    invoice.status = "sent";
    invoice.sentAt = now;
    invoice.updatedAt = now;
    
    await kv.set(`invoice:${id}`, invoice);
    
    // Create notification
    const notifId = crypto.randomUUID();
    const notification = {
      id: notifId,
      userId: invoice.clientId,
      userEmail: "",
      userName: invoice.clientName,
      type: "confirmation",
      category: "invoice",
      title: "Invoice Sent",
      message: `Invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)} has been sent to ${invoice.clientName}`,
      priority: "medium",
      channels: ["email", "in_app"],
      emailSent: false,
      smsSent: false,
      read: false,
      relatedEntityId: id,
      relatedEntityType: "invoice",
      createdAt: now,
    };
    
    await kv.set(`notification:${notifId}`, notification);
    
    return c.json({ invoice, notification });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return c.json({ error: "Failed to send invoice", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.6: COMPLIANCE VALIDATIONS
// ============================================

// Validate timesheet compliance before submission
app.post("/make-server-f8517b5b/timesheets/:id/validate", async (c) => {
  try {
    const id = c.req.param("id");
    const timesheet = await kv.get(`timesheet:${id}`);
    
    if (!timesheet) {
      return c.json({ error: "Timesheet not found" }, 404);
    }
    
    const validations = {
      immigrationStatus: { valid: true, message: "" },
      workLocation: { valid: true, message: "", activeLicenses: [] },
      poStatus: { valid: true, message: "", poUtilization: 0, poLimit: 0 },
    };
    
    let overallValid = true;
    
    // 1. Check immigration status
    const immigrationRecords = await kv.getByPrefix("immigration:record:");
    const empImmigration = (immigrationRecords || []).find((r: any) => r.employeeId === timesheet.employeeId);
    
    if (empImmigration) {
      const expiry = empImmigration.workAuthorizationExpiry;
      if (expiry && new Date(expiry) < new Date(timesheet.date)) {
        validations.immigrationStatus.valid = false;
        validations.immigrationStatus.message = `Work authorization expired on ${expiry}`;
        overallValid = false;
      }
    }
    
    // 2. Check work location against business licenses
    if (timesheet.workLocation && timesheet.workLocation !== "Remote") {
      const licenses = await kv.getByPrefix("business-license:");
      const activeLicenses = (licenses || []).filter((l: any) => 
        l.status === "Active" &&
        new Date(l.expirationDate) > new Date(timesheet.date)
      );
      
      validations.workLocation.activeLicenses = activeLicenses.map((l: any) => l.state);
      
      if (activeLicenses.length === 0) {
        validations.workLocation.valid = false;
        validations.workLocation.message = "No active business licenses for this location";
        overallValid = false;
      }
    }
    
    // 3. Check PO status and limits
    if (timesheet.assignmentId) {
      const assignment = await kv.get(`assignment:${timesheet.assignmentId}`);
      if (assignment) {
        const cost = (timesheet.regularHours || timesheet.hours || 0) * (timesheet.billingRate || assignment.billingRate || 0);
        const newUtilization = (assignment.poUtilized || 0) + cost;
        
        validations.poStatus.poUtilization = newUtilization;
        validations.poStatus.poLimit = assignment.poLimit || 0;
        
        if (newUtilization > assignment.poLimit) {
          validations.poStatus.valid = false;
          validations.poStatus.message = `PO limit exceeded: $${newUtilization.toFixed(2)} / $${assignment.poLimit.toFixed(2)}`;
          overallValid = false;
        }
        
        if (assignment.poStatus !== "active") {
          validations.poStatus.valid = false;
          validations.poStatus.message = `PO status is ${assignment.poStatus}`;
          overallValid = false;
        }
      }
    }
    
    const validation = {
      timesheetId: id,
      validations,
      overallValid,
      validatedAt: new Date().toISOString(),
    };
    
    // Save validation to timesheet
    timesheet.complianceValidation = validation;
    timesheet.complianceValid = overallValid;
    await kv.set(`timesheet:${id}`, timesheet);
    
    return c.json(validation);
  } catch (error) {
    console.error("Error validating timesheet:", error);
    return c.json({ error: "Failed to validate timesheet", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.7: EXPENSE & REIMBURSEMENT LINKING
// ============================================

// Get all expenses
app.get("/make-server-f8517b5b/expenses", async (c) => {
  try {
    const expenses = await kv.getByPrefix("expense:");
    return c.json(Array.isArray(expenses) ? expenses : []);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return c.json({ error: "Failed to fetch expenses", details: String(error) }, 500);
  }
});

// Create expense
app.post("/make-server-f8517b5b/expenses", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const expense = {
      id,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      timesheetId: body.timesheetId,
      assignmentId: body.assignmentId,
      category: body.category,
      description: body.description,
      amount: body.amount,
      date: body.date || now,
      receiptUploaded: false,
      status: "draft",
      billableToClient: body.billableToClient !== undefined ? body.billableToClient : true,
      clientId: body.clientId,
      auditTagged: false,
      createdAt: now,
      updatedAt: now,
    };
    
    await kv.set(`expense:${id}`, expense);
    return c.json(expense, 201);
  } catch (error) {
    console.error("Error creating expense:", error);
    return c.json({ error: "Failed to create expense", details: String(error) }, 500);
  }
});

// Update expense
app.put("/make-server-f8517b5b/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const expense = await kv.get(`expense:${id}`);
    if (!expense) {
      return c.json({ error: "Expense not found" }, 404);
    }
    
    const updated = {
      ...expense,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`expense:${id}`, updated);
    return c.json(updated);
  } catch (error) {
    console.error("Error updating expense:", error);
    return c.json({ error: "Failed to update expense", details: String(error) }, 500);
  }
});

// Approve/reject expense
app.post("/make-server-f8517b5b/expenses/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const expense = await kv.get(`expense:${id}`);
    if (!expense) {
      return c.json({ error: "Expense not found" }, 404);
    }
    
    expense.status = body.approved ? "approved" : "rejected";
    expense.approvedBy = body.approverId;
    expense.approvedByName = body.approverName;
    expense.approvedAt = now;
    expense.rejectionReason = body.approved ? undefined : body.reason;
    expense.updatedAt = now;
    
    await kv.set(`expense:${id}`, expense);
    return c.json(expense);
  } catch (error) {
    console.error("Error approving expense:", error);
    return c.json({ error: "Failed to approve expense", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.9: DASHBOARDS & ANALYTICS
// ============================================

// Get timesheet summary metrics
app.get("/make-server-f8517b5b/analytics/timesheet-summary", async (c) => {
  try {
    const timesheets = await kv.getByPrefix("timesheet:");
    const all = timesheets || [];
    
    const metrics = {
      totalSubmitted: all.filter((t: any) => t.status !== "draft").length,
      totalApproved: all.filter((t: any) => t.status === "approved").length,
      totalRejected: all.filter((t: any) => t.status === "rejected").length,
      totalPending: all.filter((t: any) => 
        t.status === "pending_review" || 
        t.status === "pending_client_approval" || 
        t.status === "pending_accounting_approval"
      ).length,
      submissionRate: 0,
      approvalRate: 0,
      delayedEntries: 0,
      missingTimesheets: 0,
      averageApprovalTime: 0,
    };
    
    if (metrics.totalSubmitted > 0) {
      metrics.approvalRate = (metrics.totalApproved / metrics.totalSubmitted) * 100;
    }
    
    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching timesheet summary:", error);
    return c.json({ error: "Failed to fetch timesheet summary", details: String(error) }, 500);
  }
});

// Get utilization metrics
app.get("/make-server-f8517b5b/analytics/utilization", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    const clientId = c.req.query("clientId");
    
    const timesheets = await kv.getByPrefix("timesheet:");
    let filtered = timesheets || [];
    
    if (employeeId) {
      filtered = filtered.filter((t: any) => t.employeeId === employeeId);
    }
    if (clientId) {
      filtered = filtered.filter((t: any) => t.clientId === clientId);
    }
    
    let totalHours = 0;
    let billableHours = 0;
    let nonBillableHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    
    for (const ts of filtered) {
      const hours = ts.hours || 0;
      const regular = ts.regularHours || hours;
      const overtime = ts.overtimeHours || 0;
      
      totalHours += hours;
      regularHours += regular;
      overtimeHours += overtime;
      
      if (ts.billable !== false) {
        billableHours += hours;
      } else {
        nonBillableHours += hours;
      }
    }
    
    const metrics = {
      totalHours,
      billableHours,
      nonBillableHours,
      billablePercentage: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
      regularHours,
      overtimeHours,
    };
    
    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching utilization metrics:", error);
    return c.json({ error: "Failed to fetch utilization metrics", details: String(error) }, 500);
  }
});

// Get revenue metrics
app.get("/make-server-f8517b5b/analytics/revenue", async (c) => {
  try {
    const clientId = c.req.query("clientId");
    
    const invoices = await kv.getByPrefix("invoice:");
    let filtered = invoices || [];
    
    if (clientId) {
      filtered = filtered.filter((inv: any) => inv.clientId === clientId);
    }
    
    let revenue = 0;
    let invoicedAmount = 0;
    let paidAmount = 0;
    let outstandingAmount = 0;
    
    for (const inv of filtered) {
      revenue += inv.total || 0;
      invoicedAmount += inv.total || 0;
      
      if (inv.status === "paid") {
        paidAmount += inv.total || 0;
      } else if (inv.status === "sent" || inv.status === "overdue") {
        outstandingAmount += inv.total || 0;
      }
    }
    
    const metrics = {
      revenue,
      invoicedAmount,
      paidAmount,
      outstandingAmount,
      trend: "stable",
      trendPercentage: 0,
    };
    
    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    return c.json({ error: "Failed to fetch revenue metrics", details: String(error) }, 500);
  }
});

// Get exception metrics
app.get("/make-server-f8517b5b/analytics/exceptions", async (c) => {
  try {
    const exceptions = await kv.getByPrefix("exception:");
    const all = exceptions || [];
    
    const metrics = {
      totalExceptions: all.length,
      criticalExceptions: all.filter((e: any) => e.severity === "critical").length,
      errorExceptions: all.filter((e: any) => e.severity === "error").length,
      warningExceptions: all.filter((e: any) => e.severity === "warning").length,
      exceptionsByType: {},
      unresolved: all.filter((e: any) => !e.resolvedAt).length,
      resolved: all.filter((e: any) => e.resolvedAt).length,
      averageResolutionTime: 0,
    };
    
    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching exception metrics:", error);
    return c.json({ error: "Failed to fetch exception metrics", details: String(error) }, 500);
  }
});

// Get overtime metrics
app.get("/make-server-f8517b5b/analytics/overtime", async (c) => {
  try {
    const timesheets = await kv.getByPrefix("timesheet:");
    const withOvertime = (timesheets || []).filter((t: any) => (t.overtimeHours || 0) > 0);
    
    let totalOvertimeHours = 0;
    let totalOvertimeCost = 0;
    let approvedOvertimeHours = 0;
    let unapprovedOvertimeHours = 0;
    
    for (const ts of withOvertime) {
      const hours = ts.overtimeHours || 0;
      const rate = (ts.billingRate || 0) * (ts.overtimeRate || 1.5);
      const cost = hours * rate;
      
      totalOvertimeHours += hours;
      totalOvertimeCost += cost;
      
      if (ts.overtimeApprovalEmail) {
        approvedOvertimeHours += hours;
      } else {
        unapprovedOvertimeHours += hours;
      }
    }
    
    const metrics = {
      totalOvertimeHours,
      totalOvertimeCost,
      employeeCount: new Set(withOvertime.map((t: any) => t.employeeId)).size,
      approvedOvertimeHours,
      unapprovedOvertimeHours,
      byEmployee: [],
      byClient: [],
    };
    
    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching overtime metrics:", error);
    return c.json({ error: "Failed to fetch overtime metrics", details: String(error) }, 500);
  }
});

// Get AI accuracy metrics
app.get("/make-server-f8517b5b/analytics/ai-accuracy", async (c) => {
  try {
    const timesheets = await kv.getByPrefix("timesheet:");
    const ocrProcessed = (timesheets || []).filter((t: any) => t.ocrProcessed);
    
    let totalConfidence = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    
    for (const ts of ocrProcessed) {
      const conf = ts.ocrConfidence || 0;
      totalConfidence += conf;
      
      if (conf >= 0.9) high++;
      else if (conf >= 0.7) medium++;
      else low++;
    }
    
    const metrics = {
      totalDocumentsProcessed: ocrProcessed.length,
      successfulExtractions: ocrProcessed.filter((t: any) => t.ocrConfidence >= 0.7).length,
      failedExtractions: ocrProcessed.filter((t: any) => t.ocrConfidence < 0.7).length,
      averageConfidence: ocrProcessed.length > 0 ? totalConfidence / ocrProcessed.length : 0,
      accuracyRate: ocrProcessed.length > 0 ? (high + medium) / ocrProcessed.length * 100 : 0,
      confidenceBuckets: { high, medium, low },
    };
    
    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching AI accuracy metrics:", error);
    return c.json({ error: "Failed to fetch AI accuracy metrics", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.10: CLIENT PORTAL INTEGRATION
// ============================================

// Get client portal users
app.get("/make-server-f8517b5b/client-portal/users", async (c) => {
  try {
    const clientId = c.req.query("clientId");
    const users = await kv.getByPrefix("client-portal-user:");
    
    let filtered = users || [];
    if (clientId) {
      filtered = filtered.filter((u: any) => u.clientId === clientId);
    }
    
    return c.json(filtered);
  } catch (error) {
    console.error("Error fetching client portal users:", error);
    return c.json({ error: "Failed to fetch client portal users", details: String(error) }, 500);
  }
});

// Create client portal user
app.post("/make-server-f8517b5b/client-portal/users", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const user = {
      id,
      clientId: body.clientId,
      email: body.email,
      name: body.name,
      role: body.role || "viewer",
      canApprove: body.canApprove !== undefined ? body.canApprove : false,
      canDownloadInvoices: body.canDownloadInvoices !== undefined ? body.canDownloadInvoices : true,
      canExportData: body.canExportData !== undefined ? body.canExportData : false,
      canViewReports: body.canViewReports !== undefined ? body.canViewReports : false,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    
    await kv.set(`client-portal-user:${id}`, user);
    return c.json(user, 201);
  } catch (error) {
    console.error("Error creating client portal user:", error);
    return c.json({ error: "Failed to create client portal user", details: String(error) }, 500);
  }
});

// Client portal - get timesheets for approval
app.get("/make-server-f8517b5b/client-portal/timesheets", async (c) => {
  try {
    const clientId = c.req.query("clientId");
    const timesheets = await kv.getByPrefix("timesheet:");
    
    const filtered = (timesheets || []).filter((t: any) => 
      t.clientId === clientId &&
      (t.status === "pending_client_approval" || t.status === "submitted")
    );
    
    return c.json(filtered);
  } catch (error) {
    console.error("Error fetching client portal timesheets:", error);
    return c.json({ error: "Failed to fetch client portal timesheets", details: String(error) }, 500);
  }
});

// Client portal - get invoices
app.get("/make-server-f8517b5b/client-portal/invoices", async (c) => {
  try {
    const clientId = c.req.query("clientId");
    const invoices = await kv.getByPrefix("invoice:");
    
    const filtered = (invoices || []).filter((inv: any) => inv.clientId === clientId);
    
    return c.json(filtered);
  } catch (error) {
    console.error("Error fetching client portal invoices:", error);
    return c.json({ error: "Failed to fetch client portal invoices", details: String(error) }, 500);
  }
});

// ============================================
// REQUIREMENT 3.11: NOTIFICATIONS & ALERTS
// ============================================

// Get all notifications
app.get("/make-server-f8517b5b/notifications", async (c) => {
  try {
    const userId = c.req.query("userId");
    const notifications = await kv.getByPrefix("notification:");
    
    let filtered = notifications || [];
    if (userId) {
      filtered = filtered.filter((n: any) => n.userId === userId);
    }
    
    return c.json(filtered);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return c.json({ error: "Failed to fetch notifications", details: String(error) }, 500);
  }
});

// Mark notification as read
app.put("/make-server-f8517b5b/notifications/:id/read", async (c) => {
  try {
    const id = c.req.param("id");
    const notification = await kv.get(`notification:${id}`);
    
    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }
    
    notification.read = true;
    notification.readAt = new Date().toISOString();
    
    await kv.set(`notification:${id}`, notification);
    return c.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return c.json({ error: "Failed to mark notification as read", details: String(error) }, 500);
  }
});

// Create notification (used internally by other endpoints)
app.post("/make-server-f8517b5b/notifications", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const notification = {
      id,
      userId: body.userId,
      userEmail: body.userEmail || "",
      userName: body.userName || "",
      type: body.type,
      category: body.category,
      title: body.title,
      message: body.message,
      actionUrl: body.actionUrl,
      actionLabel: body.actionLabel,
      priority: body.priority || "medium",
      channels: body.channels || ["in_app"],
      emailSent: false,
      smsSent: false,
      read: false,
      relatedEntityId: body.relatedEntityId,
      relatedEntityType: body.relatedEntityType,
      metadata: body.metadata,
      createdAt: now,
      expiresAt: body.expiresAt,
    };
    
    await kv.set(`notification:${id}`, notification);
    return c.json(notification, 201);
  } catch (error) {
    console.error("Error creating notification:", error);
    return c.json({ error: "Failed to create notification", details: String(error) }, 500);
  }
});

// ============================================
// STATE LICENSING ENDPOINTS
// ============================================

// Get all state licenses
app.get("/make-server-f8517b5b/state-licenses", async (c) => {
  try {
    const licenses = await kv.getByPrefix("state-license:");
    return c.json(Array.isArray(licenses) ? licenses : []);
  } catch (error) {
    console.error("Error fetching state licenses:", error);
    return c.json({ error: "Failed to fetch state licenses", details: String(error) }, 500);
  }
});

// Get single state license
app.get("/make-server-f8517b5b/state-licenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const license = await kv.get(`state-license:${id}`);
    
    if (!license) {
      return c.json({ error: "State license not found" }, 404);
    }
    
    return c.json(license);
  } catch (error) {
    console.error("Error fetching state license:", error);
    return c.json({ error: "Failed to fetch state license", details: String(error) }, 500);
  }
});

// Create state license
app.post("/make-server-f8517b5b/state-licenses", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stateLicense = {
      ...body,
      id,
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    await kv.set(`state-license:${id}`, stateLicense);
    return c.json(stateLicense, 201);
  } catch (error) {
    console.error("Error creating state license:", error);
    return c.json({ error: "Failed to create state license", details: String(error) }, 500);
  }
});

// Update state license
app.put("/make-server-f8517b5b/state-licenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingLicense = await kv.get(`state-license:${id}`);
    if (!existingLicense) {
      return c.json({ error: "State license not found" }, 404);
    }

    const updatedLicense = {
      ...existingLicense,
      ...body,
      id,
      createdAt: existingLicense.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`state-license:${id}`, updatedLicense);
    return c.json(updatedLicense);
  } catch (error) {
    console.error("Error updating state license:", error);
    return c.json({ error: "Failed to update state license", details: String(error) }, 500);
  }
});

// Delete state license
app.delete("/make-server-f8517b5b/state-licenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const license = await kv.get(`state-license:${id}`);
    if (!license) {
      return c.json({ error: "State license not found" }, 404);
    }

    await kv.del(`state-license:${id}`);
    return c.json({ success: true, message: "State license deleted successfully" });
  } catch (error) {
    console.error("Error deleting state license:", error);
    return c.json({ error: "Failed to delete state license", details: String(error) }, 500);
  }
});

// Send timesheet reminders (cron job)
app.post("/make-server-f8517b5b/notifications/send-reminders", async (c) => {
  try {
    const now = new Date().toISOString();
    const employees = await kv.getByPrefix("employee:");
    const reminders = [];
    
    for (const emp of (employees || [])) {
      if (!emp.canAccessTimesheets) continue;
      
      // Check if employee has timesheet for current week
      const timesheets = await kv.getByPrefix("timesheet:");
      const thisWeek = (timesheets || []).filter((t: any) => 
        t.employeeId === emp.id &&
        new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      if (thisWeek.length === 0) {
        const notifId = crypto.randomUUID();
        const notification = {
          id: notifId,
          userId: emp.id,
          userEmail: emp.email,
          userName: `${emp.firstName} ${emp.lastName}`,
          type: "reminder",
          category: "timesheet",
          title: "Timesheet Reminder",
          message: "Please submit your timesheet for this week",
          priority: "medium",
          channels: ["email", "in_app"],
          emailSent: false,
          smsSent: false,
          read: false,
          createdAt: now,
        };
        
        await kv.set(`notification:${notifId}`, notification);
        reminders.push(notification);
      }
    }
    
    return c.json({ sent: reminders.length, reminders });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return c.json({ error: "Failed to send reminders", details: String(error) }, 500);
  }
});

// ============================================
// CERTIFICATION TRACKING ENDPOINTS
// ============================================

// Get all certifications
app.get("/make-server-f8517b5b/certifications", async (c) => {
  try {
    const certifications = await kv.getByPrefix("certification:");
    return c.json({ certifications: certifications || [] });
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return c.json({ error: "Failed to fetch certifications", details: String(error) }, 500);
  }
});

// Get single certification
app.get("/make-server-f8517b5b/certifications/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const certification = await kv.get(`certification:${id}`);
    
    if (!certification) {
      return c.json({ error: "Certification not found" }, 404);
    }
    
    return c.json({ certification });
  } catch (error) {
    console.error("Error fetching certification:", error);
    return c.json({ error: "Failed to fetch certification", details: String(error) }, 500);
  }
});

// Create new certification
app.post("/make-server-f8517b5b/certifications", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.certificationType || !body.startDate || !body.expirationDate || !body.certificationRenewalDate) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newCertification = {
      id,
      employeeId: body.employeeId || undefined,
      employeeName: body.employeeName || undefined,
      certificationType: body.certificationType,
      certificationName: body.certificationName || undefined,
      issuingOrganization: body.issuingOrganization || undefined,
      certificationNumber: body.certificationNumber || undefined,
      startDate: body.startDate,
      expirationDate: body.expirationDate,
      certificationRenewalDate: body.certificationRenewalDate,
      status: body.status || 'active',
      reminderDays: body.reminderDays || [90, 60, 30, 10, 5, 1],
      lastReminderSent: undefined,
      remindersSent: [],
      attachmentUrl: body.attachmentUrl || undefined,
      uploadedFileName: body.uploadedFileName || undefined,
      notes: body.notes || undefined,
      requiresAction: body.requiresAction || false,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`certification:${id}`, newCertification);

    return c.json({ certification: newCertification }, 201);
  } catch (error) {
    console.error("Error creating certification:", error);
    return c.json({ error: "Failed to create certification", details: String(error) }, 500);
  }
});

// Update certification
app.put("/make-server-f8517b5b/certifications/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const certification = await kv.get(`certification:${id}`);
    if (!certification) {
      return c.json({ error: "Certification not found" }, 404);
    }

    const now = new Date().toISOString();

    const updatedCertification = {
      ...certification,
      employeeId: body.employeeId !== undefined ? body.employeeId : certification.employeeId,
      employeeName: body.employeeName !== undefined ? body.employeeName : certification.employeeName,
      certificationType: body.certificationType || certification.certificationType,
      certificationName: body.certificationName !== undefined ? body.certificationName : certification.certificationName,
      issuingOrganization: body.issuingOrganization !== undefined ? body.issuingOrganization : certification.issuingOrganization,
      certificationNumber: body.certificationNumber !== undefined ? body.certificationNumber : certification.certificationNumber,
      startDate: body.startDate || certification.startDate,
      expirationDate: body.expirationDate || certification.expirationDate,
      certificationRenewalDate: body.certificationRenewalDate || certification.certificationRenewalDate,
      status: body.status || certification.status,
      reminderDays: body.reminderDays || certification.reminderDays,
      attachmentUrl: body.attachmentUrl !== undefined ? body.attachmentUrl : certification.attachmentUrl,
      uploadedFileName: body.uploadedFileName !== undefined ? body.uploadedFileName : certification.uploadedFileName,
      notes: body.notes !== undefined ? body.notes : certification.notes,
      requiresAction: body.requiresAction !== undefined ? body.requiresAction : certification.requiresAction,
      updatedAt: now,
    };

    await kv.set(`certification:${id}`, updatedCertification);

    return c.json({ certification: updatedCertification });
  } catch (error) {
    console.error("Error updating certification:", error);
    return c.json({ error: "Failed to update certification", details: String(error) }, 500);
  }
});

// Delete certification
app.delete("/make-server-f8517b5b/certifications/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const certification = await kv.get(`certification:${id}`);
    if (!certification) {
      return c.json({ error: "Certification not found" }, 404);
    }

    await kv.del(`certification:${id}`);
    return c.json({ success: true, message: "Certification deleted successfully" });
  } catch (error) {
    console.error("Error deleting certification:", error);
    return c.json({ error: "Failed to delete certification", details: String(error) }, 500);
  }
});

// Upload certification document
app.post("/make-server-f8517b5b/upload-certification-document", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const bucket = formData.get("bucket") || "make-f8517b5b-certifications";

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }

    // For demo purposes, return a mock URL
    // In production, this would upload to Supabase Storage
    const mockUrl = `https://storage.example.com/${bucket}/${crypto.randomUUID()}-${file.name}`;
    
    return c.json({ 
      url: mockUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error("Error uploading certification document:", error);
    return c.json({ error: "Failed to upload document", details: String(error) }, 500);
  }
});

// ============================================
// EXTERNAL INTEGRATIONS ENDPOINTS
// ============================================

// Get all external integrations
app.get("/make-server-f8517b5b/external-integrations", async (c) => {
  try {
    const integrations = await kv.getByPrefix("external-integration:");
    return c.json({ integrations: integrations || [] });
  } catch (error) {
    console.error("Error fetching external integrations:", error);
    return c.json({ error: "Failed to fetch external integrations", details: String(error) }, 500);
  }
});

// Get single external integration
app.get("/make-server-f8517b5b/external-integrations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const integration = await kv.get(`external-integration:${id}`);
    
    if (!integration) {
      return c.json({ error: "Integration not found" }, 404);
    }
    
    return c.json({ integration });
  } catch (error) {
    console.error("Error fetching external integration:", error);
    return c.json({ error: "Failed to fetch external integration", details: String(error) }, 500);
  }
});

// Create external integration
app.post("/make-server-f8517b5b/external-integrations", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const integration = {
      id,
      module: body.module,
      enabled: body.enabled || false,
      provider: body.provider,
      customUrl: body.customUrl,
      openInNewTab: body.openInNewTab !== undefined ? body.openInNewTab : true,
      showWarning: body.showWarning !== undefined ? body.showWarning : true,
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    await kv.set(`external-integration:${id}`, integration);

    return c.json({ integration }, 201);
  } catch (error) {
    console.error("Error creating external integration:", error);
    return c.json({ error: "Failed to create external integration", details: String(error) }, 500);
  }
});

// Update external integration
app.put("/make-server-f8517b5b/external-integrations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingIntegration = await kv.get(`external-integration:${id}`);
    if (!existingIntegration) {
      return c.json({ error: "Integration not found" }, 404);
    }

    const updatedIntegration = {
      ...existingIntegration,
      ...body,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`external-integration:${id}`, updatedIntegration);

    return c.json({ integration: updatedIntegration });
  } catch (error) {
    console.error("Error updating external integration:", error);
    return c.json({ error: "Failed to update external integration", details: String(error) }, 500);
  }
});

// Delete external integration
app.delete("/make-server-f8517b5b/external-integrations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const integration = await kv.get(`external-integration:${id}`);
    if (!integration) {
      return c.json({ error: "Integration not found" }, 404);
    }

    await kv.del(`external-integration:${id}`);

    return c.json({ message: "Integration deleted successfully" });
  } catch (error) {
    console.error("Error deleting external integration:", error);
    return c.json({ error: "Failed to delete external integration", details: String(error) }, 500);
  }
});

// ============================================
// ADDRESS VALIDATION ENDPOINT
// ============================================

// Validate address using USPS Address API v3
// Falls back to basic validation if credentials are not configured
app.post("/make-server-f8517b5b/validate-address", async (c) => {
  try {
    const body = await c.req.json();
    const { street, street2, city, state, zipCode } = body;

    console.log(`📍 Address validation request: ${street}, ${city}, ${state} ${zipCode}`);

    // Get USPS API credentials from environment
    const consumerKey = Deno.env.get('USPS_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('USPS_CONSUMER_SECRET');

    // Check if we have valid credentials (not placeholders)
    const hasValidCredentials = consumerKey && consumerSecret && 
                                consumerKey.length > 20 && 
                                consumerSecret.length > 20;

    // DEMO MODE: If credentials are not configured, use basic validation
    if (!hasValidCredentials) {
      console.log("⚠️  USPS API credentials not configured - using DEMO MODE");
      console.log("📝 To enable real USPS validation:");
      console.log("   1. Get your USPS API credentials from: https://developer.usps.com");
      console.log("   2. Update USPS_CONSUMER_KEY and USPS_CONSUMER_SECRET environment variables");
      
      // Basic validation - check if required fields are present
      if (!street || !city || !state || !zipCode) {
        return c.json({
          valid: false,
          demoMode: true,
          message: "Missing required address fields",
          suggestions: []
        });
      }

      // Basic ZIP code format check
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(zipCode)) {
        return c.json({
          valid: false,
          demoMode: true,
          message: "Invalid ZIP code format. Use 5 digits (e.g., 10001) or ZIP+4 (e.g., 10001-1234)",
          suggestions: []
        });
      }

      // Basic state code check (2 letters)
      const stateRegex = /^[A-Z]{2}$/i;
      if (!stateRegex.test(state)) {
        return c.json({
          valid: false,
          demoMode: true,
          message: "Invalid state code. Use 2-letter abbreviation (e.g., CA, NY, TX)",
          suggestions: []
        });
      }

      // In demo mode, standardize basic formatting
      const standardizedAddress = {
        street: street.trim().split(' ').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' '),
        street2: street2 ? street2.trim() : '',
        city: city.trim().split(' ').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' '),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
        county: '',
        latitude: 0,
        longitude: 0,
        timezone: '',
        formattedAddress: `${street.trim()}${street2 ? ', ' + street2.trim() : ''}, ${city.trim()}, ${state.trim().toUpperCase()} ${zipCode.trim()}`
      };

      console.log("��️  Demo mode validation - basic format OK but NOT verified");

      return c.json({
        valid: true,
        demoMode: true,
        message: "⚠️ DEMO MODE: Address format is valid but NOT verified against USPS. This address may not exist!",
        warnings: [
          "🚨 WARNING: This address has NOT been verified against the USPS database",
          "The address format looks correct, but it may not be a real deliverable address",
          "To enable real USPS validation: Configure USPS_CONSUMER_KEY and USPS_CONSUMER_SECRET environment variables"
        ],
        addressChanged: false,
        originalAddress: {
          street,
          street2: street2 || '',
          city,
          state,
          zipCode
        },
        standardizedAddress: standardizedAddress,
        suggestions: [standardizedAddress],
        metadata: {
          deliveryPointValidation: 'DEMO - NOT VERIFIED',
          deliveryPointBarcode: 'N/A',
          vacant: false,
          residential: true,
          recordType: 'demo',
          countyFips: '',
          congressionalDistrict: '',
        }
      });
    }

    // REAL MODE: Use USPS API v3 for address validation
    console.log("✅ Using USPS API v3 for real address validation");

    // Build the address string for USPS API
    let streetAddress = street;
    if (street2) {
      streetAddress = `${street} ${street2}`;
    }

    // Build the request body for USPS API v3
    const requestBody = {
      streetAddress: streetAddress,
      city: city,
      state: state,
      ZIPCode: zipCode
    };

    console.log("📤 Sending request to USPS API:", requestBody);

    // Call USPS Address API v3
    // First, we need to get an OAuth token
    let tokenResponse;
    try {
      tokenResponse = await fetch('https://apis.usps.com/oauth2/v3/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: consumerKey,
          client_secret: consumerSecret,
        }),
      });
    } catch (error) {
      console.error("❌ USPS API connection error:", error);
      console.log("⚠️  Falling back to DEMO MODE due to connection error");
      
      // Fall back to demo mode
      const standardizedAddress = {
        street: street.trim(),
        street2: street2 ? street2.trim() : '',
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
        county: '',
        latitude: 0,
        longitude: 0,
        timezone: '',
        formattedAddress: `${street.trim()}${street2 ? ', ' + street2.trim() : ''}, ${city.trim()}, ${state.trim().toUpperCase()} ${zipCode.trim()}`
      };

      return c.json({
        valid: true,
        demoMode: true,
        message: "⚠️ DEMO MODE: Address format is valid but NOT verified (API connection failed)",
        warnings: [
          "🚨 WARNING: USPS API is currently unavailable",
          "Address format validated, but NOT verified against USPS database",
          "This address may not be a real deliverable address"
        ],
        addressChanged: false,
        originalAddress: { street, street2: street2 || '', city, state, zipCode },
        standardizedAddress: standardizedAddress,
        suggestions: [standardizedAddress],
        metadata: {
          deliveryPointValidation: 'DEMO - NOT VERIFIED',
          deliveryPointBarcode: 'N/A',
          vacant: false,
          residential: true,
          recordType: 'demo',
          countyFips: '',
          congressionalDistrict: '',
        }
      });
    }

    if (!tokenResponse.ok) {
      // Silently fall back to demo mode - don't log errors that might confuse users
      console.log("⚠️  USPS API credentials invalid - using DEMO MODE for address validation");
      
      const standardizedAddress = {
        street: street.trim(),
        street2: street2 ? street2.trim() : '',
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
        county: '',
        latitude: 0,
        longitude: 0,
        timezone: '',
        formattedAddress: `${street.trim()}${street2 ? ', ' + street2.trim() : ''}, ${city.trim()}, ${state.trim().toUpperCase()} ${zipCode.trim()}`
      };

      return c.json({
        valid: true,
        demoMode: true,
        message: "⚠️ DEMO MODE: Address format is valid but NOT verified (credentials invalid)",
        warnings: [
          "🚨 WARNING: USPS credentials are invalid or expired",
          "Address format validated, but NOT verified against USPS database",
          "This address may not be a real deliverable address",
          "Contact admin to configure valid USPS API credentials"
        ],
        addressChanged: false,
        originalAddress: { street, street2: street2 || '', city, state, zipCode },
        standardizedAddress: standardizedAddress,
        suggestions: [standardizedAddress],
        metadata: {
          deliveryPointValidation: 'DEMO - NOT VERIFIED',
          deliveryPointBarcode: 'N/A',
          vacant: false,
          residential: true,
          recordType: 'demo',
          countyFips: '',
          congressionalDistrict: '',
        }
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log("✅ OAuth token obtained successfully");

    // Now make the address validation request
    let response;
    try {
      response = await fetch('https://apis.usps.com/addresses/v3/address', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error("❌ USPS Address API connection error:", error);
      console.log("⚠️  Falling back to DEMO MODE");
      
      const standardizedAddress = {
        street: street.trim(),
        street2: street2 ? street2.trim() : '',
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
        county: '',
        latitude: 0,
        longitude: 0,
        timezone: '',
        formattedAddress: `${street.trim()}${street2 ? ', ' + street2.trim() : ''}, ${city.trim()}, ${state.trim().toUpperCase()} ${zipCode.trim()}`
      };

      return c.json({
        valid: true,
        demoMode: true,
        message: "⚠️ DEMO MODE: Address format is valid but NOT verified (API unavailable)",
        warnings: [
          "🚨 WARNING: USPS API is currently unavailable",
          "Address format validated, but NOT verified against USPS database"
        ],
        addressChanged: false,
        originalAddress: { street, street2: street2 || '', city, state, zipCode },
        standardizedAddress: standardizedAddress,
        suggestions: [standardizedAddress],
        metadata: {
          deliveryPointValidation: 'DEMO - NOT VERIFIED',
          deliveryPointBarcode: 'N/A',
          vacant: false,
          residential: true,
          recordType: 'demo',
          countyFips: '',
          congressionalDistrict: '',
        }
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ USPS Address API error (${response.status}):`, errorText);
      console.log("⚠️  Falling back to DEMO MODE due to API error");
      
      const standardizedAddress = {
        street: street.trim(),
        street2: street2 ? street2.trim() : '',
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
        county: '',
        latitude: 0,
        longitude: 0,
        timezone: '',
        formattedAddress: `${street.trim()}${street2 ? ', ' + street2.trim() : ''}, ${city.trim()}, ${state.trim().toUpperCase()} ${zipCode.trim()}`
      };

      return c.json({
        valid: true,
        demoMode: true,
        message: "⚠️ DEMO MODE: Address format is valid but NOT verified (API error)",
        warnings: [
          "🚨 WARNING: USPS API returned an error",
          "Address format validated, but NOT verified against USPS database",
          response.status === 429 ? "Rate limit exceeded - try again later" : `API Error: ${response.status}`
        ],
        addressChanged: false,
        originalAddress: { street, street2: street2 || '', city, state, zipCode },
        standardizedAddress: standardizedAddress,
        suggestions: [standardizedAddress],
        metadata: {
          deliveryPointValidation: 'DEMO - NOT VERIFIED',
          deliveryPointBarcode: 'N/A',
          vacant: false,
          residential: true,
          recordType: 'demo',
          countyFips: '',
          congressionalDistrict: '',
        }
      });
    }

    const results = await response.json();
    console.log(`📊 USPS API response:`, JSON.stringify(results, null, 2));

    // Check if the USPS API returned an address
    const address = results.address;
    
    if (!address) {
      console.log("Address validation failed - no address returned");
      return c.json({
        valid: false,
        message: "Address could not be validated. Please verify the address details.",
        suggestions: []
      });
    }

    // Parse the USPS response
    // USPS v3 API returns fields like: streetAddress, city, state, ZIPCode, ZIPPlus4, etc.
    const deliveryAddress = address.streetAddress || address.deliveryAddress || '';
    const returnedCity = address.city || '';
    const returnedState = address.state || '';
    const returnedZip = address.ZIPCode || '';
    const zip4 = address.ZIPPlus4 || '';
    
    // Split delivery address into street and street2 if possible
    let standardizedStreet = deliveryAddress;
    let standardizedStreet2 = '';
    
    // Try to extract unit/apt from the address if it exists
    const aptMatch = deliveryAddress.match(/^(.+?)(\s+(APT|UNIT|STE|#)\s*.+)$/i);
    if (aptMatch) {
      standardizedStreet = aptMatch[1].trim();
      standardizedStreet2 = aptMatch[2].trim();
    }

    // Build standardized address
    const fullZip = zip4 ? `${returnedZip}-${zip4}` : returnedZip;
    const standardizedAddress = {
      street: standardizedStreet,
      street2: standardizedStreet2,
      city: returnedCity,
      state: returnedState,
      zipCode: fullZip,
      county: address.county || '',
      latitude: address.latitude || 0,
      longitude: address.longitude || 0,
      timezone: '',
      formattedAddress: `${deliveryAddress}, ${returnedCity}, ${returnedState} ${fullZip}`
    };

    // Check the validation result
    // USPS v3 API may have different validation indicators
    const addressValid = address.addressValid !== false; // Assuming this field exists
    const isDPVConfirmed = address.DPVConfirmation === 'Y' || addressValid;
    
    // Determine if address is valid based on USPS validation
    let isValid = isDPVConfirmed;
    let validationMessage = '';
    let warnings = [];

    // Check for various USPS indicators (field names may vary in v3)
    if (address.vacant === 'Y' || address.isVacant) {
      warnings.push('This address is marked as vacant by USPS');
      isValid = false;
    }

    if (address.DPVConfirmation === 'D') {
      warnings.push('This is a missing secondary number (apartment/suite/unit)');
      isValid = false;
    }

    if (address.DPVConfirmation === 'S') {
      warnings.push('Address confirmed but missing secondary number');
    }

    if (address.footnotes) {
      const footnotes = address.footnotes;
      if (footnotes.includes('N1') || footnotes.includes('N#')) {
        warnings.push('High-rise building with no apartment/suite number');
      }
    }

    // Check if corrections were made
    const addressChanged = 
      street.toLowerCase() !== standardizedStreet.toLowerCase() ||
      city.toLowerCase() !== returnedCity.toLowerCase() ||
      state.toLowerCase() !== returnedState.toLowerCase() ||
      !zipCode.startsWith(returnedZip);

    if (addressChanged && isValid) {
      validationMessage = 'Address validated and standardized by USPS';
    } else if (isValid) {
      validationMessage = 'Address verified by USPS';
    } else {
      validationMessage = 'Address validation failed';
    }

    console.log(`Address validation complete. Valid: ${isValid}`);

    return c.json({
      valid: isValid,
      message: validationMessage,
      warnings: warnings,
      addressChanged: addressChanged,
      originalAddress: {
        street,
        street2: street2 || '',
        city,
        state,
        zipCode
      },
      standardizedAddress: standardizedAddress,
      suggestions: isValid ? [standardizedAddress] : [],
      metadata: {
        deliveryPointValidation: address.DPVConfirmation || 'Unknown',
        deliveryPointBarcode: address.DPVBarcode || '',
        vacant: address.vacant === 'Y' || address.isVacant || false,
        residential: address.residential || false,
        recordType: address.recordType || 'standard',
        countyFips: address.countyFIPS || '',
        congressionalDistrict: address.congressionalDistrict || '',
      }
    });

  } catch (error) {
    console.error("Error validating address:", error);
    return c.json({ 
      error: "Failed to validate address", 
      details: String(error),
      message: "An error occurred while validating the address. Please try again."
    }, 500);
  }
});

// ============================================
// PRODUCT ADMIN ENDPOINTS
// ============================================

// Get platform-wide metrics
app.get("/make-server-f8517b5b/product-admin/platform-metrics", async (c) => {
  try {
    // Fetch all data from KV store
    const employees = await kv.getByPrefix("employee:");
    const clients = await kv.getByPrefix("client:");
    const projects = await kv.getByPrefix("project:");
    const organizations = await kv.getByPrefix("organization:");
    const users = await kv.getByPrefix("user:");
    const timesheets = await kv.getByPrefix("timesheet:");

    // Calculate metrics
    const totalOrganizations = (organizations || []).length;
    const totalUsers = (users || []).length;
    const activeUsers = (users || []).filter((u: any) => {
      const lastLogin = new Date(u.lastLoginAt || u.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastLogin >= thirtyDaysAgo;
    }).length;
    const totalEmployees = (employees || []).length;
    const totalClients = (clients || []).length;
    const totalProjects = (projects || []).length;

    // Calculate revenue (sample calculation - adjust based on your subscription model)
    const monthlyRevenue = (organizations || []).reduce((sum: number, org: any) => {
      const planRevenue = {
        'free': 0,
        'starter': 49,
        'professional': 149,
        'enterprise': 499
      };
      return sum + (planRevenue[org.subscriptionPlan as keyof typeof planRevenue] || 0);
    }, 0);

    const totalRevenue = monthlyRevenue * 12; // Annual

    return c.json({
      totalOrganizations,
      totalUsers,
      activeUsers,
      totalEmployees,
      totalClients,
      totalProjects,
      totalRevenue,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    return c.json({ error: "Failed to fetch platform metrics", details: String(error) }, 500);
  }
});

// Get system health metrics
app.get("/make-server-f8517b5b/product-admin/system-health", async (c) => {
  try {
    // Simulate system health metrics
    // In production, these would come from actual monitoring services
    const systemHealth = {
      status: "healthy" as "healthy" | "degraded" | "down",
      uptime: 99.97,
      responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
      cpuUsage: Math.random() * 40 + 20, // 20-60%
      memoryUsage: Math.random() * 30 + 40, // 40-70%
      diskUsage: Math.random() * 20 + 30, // 30-50%
      databaseConnections: Math.floor(Math.random() * 50) + 10, // 10-60
      apiCalls: Math.floor(Math.random() * 10000) + 5000, // 5000-15000
      errorRate: Math.random() * 0.5, // 0-0.5%
    };

    return c.json(systemHealth);
  } catch (error) {
    console.error("Error fetching system health:", error);
    return c.json({ error: "Failed to fetch system health", details: String(error) }, 500);
  }
});

// Get all organizations
app.get("/make-server-f8517b5b/product-admin/organizations", async (c) => {
  try {
    const organizations = await kv.getByPrefix("organization:");
    
    // Enrich organization data with counts
    const enrichedOrgs = await Promise.all((organizations || []).map(async (org: any) => {
      const orgUsers = await kv.getByPrefix(`user:${org.id}`);
      const orgEmployees = await kv.getByPrefix(`employee:${org.id}`);
      
      const planRevenue = {
        'free': 0,
        'starter': 49,
        'professional': 149,
        'enterprise': 499
      };

      return {
        id: org.id,
        name: org.name,
        subscriptionPlan: org.subscriptionPlan || 'free',
        userCount: (orgUsers || []).length,
        employeeCount: (orgEmployees || []).length,
        status: org.status || 'active',
        createdAt: org.createdAt,
        monthlyRevenue: planRevenue[org.subscriptionPlan as keyof typeof planRevenue] || 0,
      };
    }));

    return c.json(enrichedOrgs);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return c.json({ error: "Failed to fetch organizations", details: String(error) }, 500);
  }
});

// Get subscription metrics
app.get("/make-server-f8517b5b/product-admin/subscription-metrics", async (c) => {
  try {
    const organizations = await kv.getByPrefix("organization:");
    
    const metrics = {
      free: 0,
      starter: 0,
      professional: 0,
      enterprise: 0,
    };

    (organizations || []).forEach((org: any) => {
      const plan = org.subscriptionPlan || 'free';
      if (plan in metrics) {
        metrics[plan as keyof typeof metrics]++;
      }
    });

    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching subscription metrics:", error);
    return c.json({ error: "Failed to fetch subscription metrics", details: String(error) }, 500);
  }
});

// Create organization (for testing/demo purposes)
app.post("/make-server-f8517b5b/product-admin/organizations", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const organization = {
      id,
      name: body.name,
      subscriptionPlan: body.subscriptionPlan || 'free',
      status: body.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`organization:${id}`, organization);
    return c.json(organization, 201);
  } catch (error) {
    console.error("Error creating organization:", error);
    return c.json({ error: "Failed to create organization", details: String(error) }, 500);
  }
});

// Suspend organization
app.post("/make-server-f8517b5b/product-admin/organizations/:id/suspend", async (c) => {
  try {
    const id = c.req.param("id");
    const organization = await kv.get(`organization:${id}`);
    
    if (!organization) {
      return c.json({ error: "Organization not found" }, 404);
    }
    
    organization.status = "suspended";
    organization.updatedAt = new Date().toISOString();
    
    await kv.set(`organization:${id}`, organization);
    return c.json(organization);
  } catch (error) {
    console.error("Error suspending organization:", error);
    return c.json({ error: "Failed to suspend organization", details: String(error) }, 500);
  }
});

// Activate organization
app.post("/make-server-f8517b5b/product-admin/organizations/:id/activate", async (c) => {
  try {
    const id = c.req.param("id");
    const organization = await kv.get(`organization:${id}`);
    
    if (!organization) {
      return c.json({ error: "Organization not found" }, 404);
    }
    
    organization.status = "active";
    organization.updatedAt = new Date().toISOString();
    
    await kv.set(`organization:${id}`, organization);
    return c.json(organization);
  } catch (error) {
    console.error("Error activating organization:", error);
    return c.json({ error: "Failed to activate organization", details: String(error) }, 500);
  }
});

// Update organization subscription
app.put("/make-server-f8517b5b/product-admin/organizations/:id/subscription", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const organization = await kv.get(`organization:${id}`);
    
    if (!organization) {
      return c.json({ error: "Organization not found" }, 404);
    }
    
    organization.subscriptionPlan = body.subscriptionPlan;
    organization.updatedAt = new Date().toISOString();
    
    await kv.set(`organization:${id}`, organization);
    return c.json(organization);
  } catch (error) {
    console.error("Error updating organization subscription:", error);
    return c.json({ error: "Failed to update subscription", details: String(error) }, 500);
  }
});

// ============================================
// USER & ROLE MANAGEMENT ENDPOINTS
// ============================================

// Get all users (Product Admin only)
app.get("/make-server-f8517b5b/users/all", async (c) => {
  try {
    const users = await kv.getByPrefix("user:");
    const organizations = await kv.getByPrefix("organization:");
    
    console.log('Raw users from KV:', users?.length);
    console.log('Sample user structure:', users?.[0]);
    
    // Create a map of organization IDs to names
    const orgMap = new Map();
    for (const org of organizations || []) {
      orgMap.set(org.id, org.name);
    }
    
    // Enrich users with organization names and ensure ID is set
    const enrichedUsers = (users || []).map((user: any) => ({
      ...user,
      // Ensure id is set - use existing id or fallback to email
      id: user.id || user.email,
      organizationName: user.organizationId ? orgMap.get(user.organizationId) : null,
    }));
    
    console.log('Enriched users sample:', enrichedUsers[0]);
    
    return c.json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return c.json({ error: "Failed to fetch users", details: String(error) }, 500);
  }
});

// Get organizations list
app.get("/make-server-f8517b5b/organizations", async (c) => {
  try {
    const organizations = await kv.getByPrefix("organization:");
    const users = await kv.getByPrefix("user:");
    
    // Count users per organization
    const userCounts = new Map();
    for (const user of users || []) {
      if (user.organizationId) {
        const count = userCounts.get(user.organizationId) || 0;
        userCounts.set(user.organizationId, count + 1);
      }
    }
    
    // Enrich organizations with user counts
    const enrichedOrgs = (organizations || []).map((org: any) => ({
      ...org,
      userCount: userCounts.get(org.id) || 0,
    }));
    
    return c.json(enrichedOrgs);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return c.json({ error: "Failed to fetch organizations", details: String(error) }, 500);
  }
});

// Delete organization
app.delete("/make-server-f8517b5b/organizations/:id", async (c) => {
  try {
    const orgId = c.req.param("id");
    
    // Check if organization exists
    const organization = await kv.get(`organization:${orgId}`);
    if (!organization) {
      return c.json({ error: "Organization not found" }, 404);
    }
    
    console.log(`Deleting organization: ${organization.name} (${orgId})`);
    
    // Delete all users belonging to this organization
    const allUsers = await kv.getByPrefix("user:");
    const orgUsers = (allUsers || []).filter((user: any) => user.organizationId === orgId);
    for (const user of orgUsers) {
      await kv.del(`user:${user.id}`);
      console.log(`  - Deleted user: ${user.email}`);
    }
    
    // Delete all custom roles belonging to this organization
    const allRoles = await kv.getByPrefix("custom-role:");
    const orgRoles = (allRoles || []).filter((role: any) => role.organizationId === orgId);
    for (const role of orgRoles) {
      await kv.del(`custom-role:${role.id}`);
      console.log(`  - Deleted custom role: ${role.displayName}`);
    }
    
    // Delete all employees belonging to this organization
    const allEmployees = await kv.getByPrefix("employee:");
    const orgEmployees = (allEmployees || []).filter((emp: any) => emp.organizationId === orgId);
    for (const employee of orgEmployees) {
      await kv.del(`employee:${employee.id}`);
      console.log(`  - Deleted employee: ${employee.name}`);
    }
    
    // Delete all clients belonging to this organization
    const allClients = await kv.getByPrefix("client:");
    const orgClients = (allClients || []).filter((client: any) => client.organizationId === orgId);
    for (const client of orgClients) {
      await kv.del(`client:${client.id}`);
      console.log(`  - Deleted client: ${client.name}`);
    }
    
    // Delete all immigration cases belonging to this organization
    const allImmigration = await kv.getByPrefix("immigration:");
    const orgImmigration = (allImmigration || []).filter((imm: any) => imm.organizationId === orgId);
    for (const immigrationCase of orgImmigration) {
      await kv.del(`immigration:${immigrationCase.id}`);
      console.log(`  - Deleted immigration case: ${immigrationCase.employeeName}`);
    }
    
    // Delete all timesheets belonging to this organization
    const allTimesheets = await kv.getByPrefix("timesheet:");
    const orgTimesheets = (allTimesheets || []).filter((ts: any) => ts.organizationId === orgId);
    for (const timesheet of orgTimesheets) {
      await kv.del(`timesheet:${timesheet.id}`);
    }
    console.log(`  - Deleted ${orgTimesheets.length} timesheets`);
    
    // Delete all projects belonging to this organization
    const allProjects = await kv.getByPrefix("project:");
    const orgProjects = (allProjects || []).filter((proj: any) => proj.organizationId === orgId);
    for (const project of orgProjects) {
      await kv.del(`project:${project.id}`);
    }
    console.log(`  - Deleted ${orgProjects.length} projects`);
    
    // Finally, delete the organization itself
    await kv.del(`organization:${orgId}`);
    
    console.log(`✅ Organization "${organization.name}" and all associated data permanently deleted`);
    
    return c.json({ 
      success: true, 
      message: `Organization "${organization.name}" has been permanently deleted`,
      deletedCounts: {
        users: orgUsers.length,
        customRoles: orgRoles.length,
        employees: orgEmployees.length,
        clients: orgClients.length,
        immigrationCases: orgImmigration.length,
        timesheets: orgTimesheets.length,
        projects: orgProjects.length,
      }
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return c.json({ error: "Failed to delete organization", details: String(error) }, 500);
  }
});

// Update user role
app.put("/make-server-f8517b5b/users/:id/role", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    const updatedUser = {
      ...user,
      role: body.role,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${id}`, updatedUser);
    
    console.log(`User ${user.email} role updated to ${body.role}`);
    
    return c.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    return c.json({ error: "Failed to update user role", details: String(error) }, 500);
  }
});

// Update user status
app.put("/make-server-f8517b5b/users/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    const updatedUser = {
      ...user,
      status: body.status,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${id}`, updatedUser);
    
    console.log(`User ${user.email} status updated to ${body.status}`);
    
    return c.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    return c.json({ error: "Failed to update user status", details: String(error) }, 500);
  }
});

// Update user profile (generic)
app.put("/make-server-f8517b5b/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    let key = `user:${id}`;
    let user = await kv.get(key);
    
    if (!user) {
      key = `employee:${id}`;
      user = await kv.get(key);
    }
    
    if (!user) {
      if (body.email && body.role) {
        console.log(`Creating new user record for ${body.email} (${id})`);
        // Default to user: prefix for new generic users
        key = `user:${id}`;
        user = {
          id: id,
          email: body.email,
          role: body.role,
          createdAt: new Date().toISOString(),
          firstName: body.firstName || '',
          lastName: body.lastName || '',
          name: body.name || '',
        };
      } else {
        return c.json({ error: "User not found" }, 404);
      }
    }
    
    const updatedUser = {
      ...user,
      firstName: body.firstName !== undefined ? body.firstName : user.firstName,
      lastName: body.lastName !== undefined ? body.lastName : user.lastName,
      name: body.name !== undefined ? body.name : user.name,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(key, updatedUser);
    
    console.log(`User/Employee ${user.email} updated`);
    
    return c.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user", details: String(error) }, 500);
  }
});

// Delete user
app.delete("/make-server-f8517b5b/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    console.log(`Attempting to delete user with id: ${id}`);
    
    let user = await kv.get(`user:${id}`);
    
    // If not found by ID, try to find by email (fallback)
    if (!user) {
      console.log(`User not found with id ${id}, trying to find by email...`);
      const allUsers = await kv.getByPrefix("user:");
      user = (allUsers || []).find((u: any) => u.email === id || u.id === id);
      
      if (user) {
        console.log(`Found user by email/search: ${user.email}, actual id: ${user.id}`);
        // Delete using the actual key
        await kv.del(`user:${user.id}`);
        console.log(`✅ User ${user.email} (${user.id}) deleted successfully`);
        
        return c.json({ 
          success: true,
          message: "User deleted successfully",
          deletedUser: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        });
      }
      
      console.log(`Delete user failed: User not found with id or email ${id}`);
      return c.json({ error: "User not found" }, 404);
    }
    
    // Delete the user
    await kv.del(`user:${id}`);
    
    console.log(`✅ User ${user.email} (${id}) deleted successfully`);
    
    return c.json({ 
      success: true,
      message: "User deleted successfully",
      deletedUser: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, 200);
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ 
      success: false,
      error: "Failed to delete user", 
      details: String(error) 
    }, 500);
  }
});

// Update role permissions (stored in KV for customization)
app.put("/make-server-f8517b5b/roles/:role/permissions", async (c) => {
  try {
    const role = c.req.param("role");
    const body = await c.req.json();
    
    const roleConfig = {
      role,
      permissions: body.permissions,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`role-config:${role}`, roleConfig);
    
    console.log(`Permissions updated for role: ${role}`);
    
    return c.json(roleConfig);
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return c.json({ error: "Failed to update role permissions", details: String(error) }, 500);
  }
});

// Get custom role permissions
app.get("/make-server-f8517b5b/roles/:role/permissions", async (c) => {
  try {
    const role = c.req.param("role");
    const roleConfig = await kv.get(`role-config:${role}`);
    
    if (!roleConfig) {
      return c.json({ error: "Role configuration not found" }, 404);
    }
    
    return c.json(roleConfig);
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return c.json({ error: "Failed to fetch role permissions", details: String(error) }, 500);
  }
});

// ============================================
// SUBSCRIPTION MANAGEMENT ENDPOINTS
// ============================================

// Get current organization's subscription
app.get("/make-server-f8517b5b/subscription", async (c) => {
  try {
    // For demo purposes, we'll get the first organization
    // In production, this would be based on the authenticated user's organization
    const organizations = await kv.getByPrefix("organization:");
    
    if (!organizations || organizations.length === 0) {
      // Return default free plan if no organization found
      return c.json({
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 0,
      });
    }
    
    const org = organizations[0];
    
    // Calculate subscription details based on organization plan
    const planPrices: Record<string, { monthly: number, annual: number }> = {
      free: { monthly: 0, annual: 0 },
      starter: { monthly: 99, annual: 990 },
      professional: { monthly: 249, annual: 2490 },
      enterprise: { monthly: 499, annual: 4990 },
    };
    
    const billingCycle = org.billingCycle || 'monthly';
    const amount = billingCycle === 'monthly' 
      ? planPrices[org.subscriptionPlan]?.monthly || 0
      : planPrices[org.subscriptionPlan]?.annual || 0;
    
    const currentPeriodStart = org.subscriptionStartDate || org.createdAt;
    const periodDays = billingCycle === 'monthly' ? 30 : 365;
    const currentPeriodEnd = new Date(new Date(currentPeriodStart).getTime() + periodDays * 24 * 60 * 60 * 1000).toISOString();
    
    return c.json({
      plan: org.subscriptionPlan || 'free',
      status: org.status || 'active',
      billingCycle,
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate: currentPeriodEnd,
      amount,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return c.json({ error: "Failed to fetch subscription", details: String(error) }, 500);
  }
});

// Change subscription plan
app.post("/make-server-f8517b5b/subscription/change", async (c) => {
  try {
    const body = await c.req.json();
    const { plan, billingCycle } = body;
    
    if (!plan || !billingCycle) {
      return c.json({ error: "Plan and billing cycle are required" }, 400);
    }
    
    // Validate plan
    const validPlans = ['free', 'starter', 'professional', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return c.json({ error: "Invalid plan" }, 400);
    }
    
    // Validate billing cycle
    const validCycles = ['monthly', 'annual'];
    if (!validCycles.includes(billingCycle)) {
      return c.json({ error: "Invalid billing cycle" }, 400);
    }
    
    // Get first organization (in production, this would be based on authenticated user)
    const organizations = await kv.getByPrefix("organization:");
    
    if (!organizations || organizations.length === 0) {
      return c.json({ error: "No organization found" }, 404);
    }
    
    const org = organizations[0];
    
    // Update organization subscription
    org.subscriptionPlan = plan;
    org.billingCycle = billingCycle;
    org.subscriptionStartDate = new Date().toISOString();
    org.updatedAt = new Date().toISOString();
    
    await kv.set(`organization:${org.id}`, org);
    
    console.log(`Organization ${org.name} subscription updated to ${plan} (${billingCycle})`);
    
    return c.json({
      success: true,
      message: `Successfully changed to ${plan} plan`,
      organization: org,
    });
  } catch (error) {
    console.error("Error changing subscription:", error);
    return c.json({ error: "Failed to change subscription", details: String(error) }, 500);
  }
});

// ============================================
// CUSTOM ROLE MANAGEMENT ENDPOINTS
// ============================================

// Get all custom roles
app.get("/make-server-f8517b5b/custom-roles", async (c) => {
  try {
    const customRoles = await kv.getByPrefix("custom-role:");
    return c.json(Array.isArray(customRoles) ? customRoles : []);
  } catch (error) {
    console.error("Error fetching custom roles:", error);
    return c.json({ error: "Failed to fetch custom roles", details: String(error) }, 500);
  }
});

// Create custom role
app.post("/make-server-f8517b5b/custom-roles", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.roleName || !body.displayName) {
      return c.json({ error: "Role name and display name are required" }, 400);
    }
    
    // Check if role name already exists (both system and custom)
    const systemRoles = [
      'product-admin', 'admin', 'hr', 'recruiter', 'accounting-manager',
      'immigration-team', 'licensing-team', 'accounting-team', 'client-admin',
      'employee'
    ];
    
    if (systemRoles.includes(body.roleName)) {
      return c.json({ error: "Cannot create custom role with system role name" }, 400);
    }
    
    // Check if custom role already exists for this organization
    const existingRoles = await kv.getByPrefix("custom-role:");
    const roleExists = (existingRoles || []).some(
      (r: any) => r.roleName === body.roleName && r.organizationId === body.organizationId
    );
    
    if (roleExists) {
      return c.json({ error: "A role with this name already exists in your organization" }, 400);
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const customRole = {
      id,
      roleName: body.roleName,
      displayName: body.displayName,
      description: body.description || '',
      permissions: body.permissions || {},
      organizationId: body.organizationId || null,
      createdBy: body.createdBy || null,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
    
    await kv.set(`custom-role:${id}`, customRole);
    
    console.log(`Custom role created: ${body.displayName} (${body.roleName})`);
    
    return c.json(customRole, 201);
  } catch (error) {
    console.error("Error creating custom role:", error);
    return c.json({ error: "Failed to create custom role", details: String(error) }, 500);
  }
});

// Update custom role
app.put("/make-server-f8517b5b/custom-roles/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingRole = await kv.get(`custom-role:${id}`);
    if (!existingRole) {
      return c.json({ error: "Custom role not found" }, 404);
    }
    
    const updatedRole = {
      ...existingRole,
      displayName: body.displayName || existingRole.displayName,
      description: body.description !== undefined ? body.description : existingRole.description,
      permissions: body.permissions || existingRole.permissions,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`custom-role:${id}`, updatedRole);
    
    console.log(`Custom role updated: ${updatedRole.displayName}`);
    
    return c.json(updatedRole);
  } catch (error) {
    console.error("Error updating custom role:", error);
    return c.json({ error: "Failed to update custom role", details: String(error) }, 500);
  }
});

// Delete custom role
app.delete("/make-server-f8517b5b/custom-roles/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const role = await kv.get(`custom-role:${id}`);
    if (!role) {
      return c.json({ error: "Custom role not found" }, 404);
    }
    
    // Check if any users have this role
    const users = await kv.getByPrefix("user:");
    const usersWithRole = (users || []).filter((u: any) => u.role === role.roleName);
    
    if (usersWithRole.length > 0) {
      return c.json({ 
        error: "Cannot delete role that is assigned to users",
        details: `${usersWithRole.length} user(s) currently have this role`,
        userCount: usersWithRole.length
      }, 400);
    }
    
    await kv.del(`custom-role:${id}`);
    
    console.log(`Custom role deleted: ${role.displayName}`);
    
    return c.json({ message: "Custom role deleted successfully" });
  } catch (error) {
    console.error("Error deleting custom role:", error);
    return c.json({ error: "Failed to delete custom role", details: String(error) }, 500);
  }
});

// ============================================
// USER & ORGANIZATION MANAGEMENT
// ============================================

// Sign up new organization with admin user
app.post("/make-server-f8517b5b/signup", async (c) => {
  try {
    const body = await c.req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      organizationName,
      phone,
      industry,
      companySize,
      selectedPlan = 'free',
      billingCycle = 'monthly',
      // Billing information
      cardHolderName,
      cardNumber,
      expiryDate,
      cvv,
      billingStreet,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !organizationName) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Validate billing info for paid plans
    if (selectedPlan !== 'free') {
      if (!cardHolderName || !cardNumber || !expiryDate || !cvv || !billingStreet || !billingCity || !billingState || !billingZip || !billingCountry) {
        return c.json({ error: "Billing information is required for paid plans" }, 400);
      }
    }

    // Check if email already exists
    const existingUsers = await kv.getByPrefix("user:");
    const emailExists = (existingUsers || []).some((u: any) => u.email === email);
    
    if (emailExists) {
      return c.json({ error: "Email already exists" }, 400);
    }

    const now = new Date().toISOString();
    const organizationId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    // Create organization
    const organization = {
      id: organizationId,
      name: organizationName,
      phone: phone || "",
      industry: industry || "",
      companySize: companySize || "",
      subscriptionPlan: selectedPlan,
      billingCycle: billingCycle,
      status: selectedPlan === 'free' ? 'active' : 'trial',
      trialEndsAt: selectedPlan === 'free' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`organization:${organizationId}`, organization);

    // Store billing information separately if provided (for paid plans)
    if (selectedPlan !== 'free' && cardNumber) {
      // In production, this should be encrypted and handled by a payment processor like Stripe
      // For now, we'll store a masked version
      const billingInfo = {
        organizationId: organizationId,
        cardHolderName: cardHolderName,
        cardLastFour: cardNumber.replace(/\s/g, '').slice(-4),
        cardBrand: 'Unknown', // In production, detect card brand
        expiryDate: expiryDate,
        billingAddress: {
          street: billingStreet,
          city: billingCity,
          state: billingState,
          zip: billingZip,
          country: billingCountry,
        },
        createdAt: now,
        updatedAt: now,
      };
      
      await kv.set(`billing:${organizationId}`, billingInfo);
      console.log(`✅ Billing information stored for organization: ${organizationName}`);
    }

    // Create admin user (first user in organization gets admin role)
    const user = {
      id: userId,
      email: email,
      password: password, // In production, this should be hashed!
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`,
      role: 'admin', // First user is always admin
      organizationId: organizationId,
      organizationName: organizationName,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`user:${userId}`, user);

    console.log(`✅ New organization created: ${organizationName}`);
    console.log(`✅ Admin user created: ${email} (${firstName} ${lastName})`);

    // Return success (don't return password or sensitive billing data)
    const { password: _, ...userWithoutPassword } = user;
    
    return c.json({
      success: true,
      message: "Account created successfully",
      user: userWithoutPassword,
      organization: organization,
    }, 201);
  } catch (error) {
    console.error("Error creating account:", error);
    return c.json({ error: "Failed to create account", details: String(error) }, 500);
  }
});

// Get users by organization (for admin to manage team)
app.get("/make-server-f8517b5b/users", async (c) => {
  try {
    const organizationId = c.req.query("organizationId");
    
    const allUsers = await kv.getByPrefix("user:");
    
    if (organizationId) {
      const orgUsers = (allUsers || []).filter((u: any) => u.organizationId === organizationId);
      return c.json({ users: orgUsers });
    }
    
    return c.json({ users: allUsers || [] });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users", details: String(error) }, 500);
  }
});

// Create additional user in organization (by admin)
app.post("/make-server-f8517b5b/users", async (c) => {
  try {
    const body = await c.req.json();
    const {
      email,
      firstName,
      lastName,
      role,
      organizationId,
      password = 'password123', // Default password
    } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !role || !organizationId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Check if email already exists
    const existingUsers = await kv.getByPrefix("user:");
    const existingUser = (existingUsers || []).find((u: any) => u.email === email);
    
    if (existingUser) {
      // If user exists in the same organization, update them instead of failing
      if (existingUser.organizationId === organizationId) {
        console.log(`User ${email} already exists in organization, updating record...`);
        
        const updatedUser = {
          ...existingUser,
          firstName: firstName,
          lastName: lastName,
          name: `${firstName} ${lastName}`,
          role: role,
          status: 'active', // Reactivate user
          updatedAt: new Date().toISOString(),
        };
        
        // If password provided in request (not default), update it
        if (password && password !== 'password123') {
          updatedUser.password = password;
        }
        
        await kv.set(`user:${existingUser.id}`, updatedUser);
        
        const { password: _, ...userWithoutPassword } = updatedUser;
        return c.json({
          success: true,
          message: "User updated successfully",
          user: userWithoutPassword,
        }, 200);
      }
      
      return c.json({ error: "Email already exists in another organization" }, 400);
    }

    // Get organization to verify it exists
    const organization = await kv.get(`organization:${organizationId}`);
    if (!organization) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const now = new Date().toISOString();
    const userId = crypto.randomUUID();

    // Create user
    const user = {
      id: userId,
      email: email,
      password: password, // In production, this should be hashed!
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`,
      role: role,
      organizationId: organizationId,
      organizationName: organization.name,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`user:${userId}`, user);

    console.log(`✅ User created: ${email} (${role}) in organization ${organization.name}`);

    // Return success (don't return password)
    const { password: _, ...userWithoutPassword } = user;
    
    return c.json({
      success: true,
      message: "User created successfully",
      user: userWithoutPassword,
    }, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json({ error: "Failed to create user", details: String(error) }, 500);
  }
});

// Change user password (generic endpoint for all user types)
app.post("/make-server-f8517b5b/users/change-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email, newPassword, currentPassword, userId } = body;

    if (!email || !newPassword || !currentPassword) {
      return c.json({ error: "Email, current password, and new password are required" }, 400);
    }

    // Try to find user in "user:" prefix (Admins, HR, etc created via signup or admin panel)
    let userKey = `user:${userId}`;
    let user = await kv.get(userKey);
    
    // If not found by ID, try searching by email in user prefix
    if (!user) {
      const allUsers = await kv.getByPrefix("user:");
      user = (allUsers || []).find((u: any) => u.email === email);
      if (user) {
        userKey = `user:${user.id}`;
      }
    }

    // If still not found, try employee prefix
    if (!user) {
      // If provided ID, try direct lookup
      if (userId) {
        userKey = `employee:${userId}`;
        user = await kv.get(userKey);
      }
      
      // If not found by ID, try searching by email
      if (!user) {
        const employees = await kv.getByPrefix("employee:");
        user = (employees || []).find((emp: any) => emp.email === email);
        if (user) {
          userKey = `employee:${user.id}`;
        }
      }
    }

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Verify current password
    // Check main password field or temporary password field if it exists
    const passwordMatch = user.password === currentPassword || 
                         (user.temporaryPassword && user.temporaryPassword === currentPassword);

    if (!passwordMatch) {
      return c.json({ error: "Incorrect current password" }, 401);
    }

    const now = new Date().toISOString();

    // Update password
    const updatedUser = {
      ...user,
      password: newPassword, // In production, hash this!
      updatedAt: now,
    };

    // If it's an employee, also clear temporary password flags
    if (userKey.startsWith("employee:")) {
      updatedUser.temporaryPassword = "";
      updatedUser.requiresPasswordReset = false;
      updatedUser.profileCompleted = true;
    }

    await kv.set(userKey, updatedUser);

    return c.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return c.json({ error: "Failed to change password", details: String(error) }, 500);
  }
});

// ============================================
// PRODUCT ADMIN ENDPOINTS
// ============================================

// Get platform-wide metrics
app.get("/make-server-f8517b5b/product-admin/platform-metrics", async (c) => {
  try {
    const organizations = await kv.getByPrefix("organization:");
    const users = await kv.getByPrefix("user:");
    const employees = await kv.getByPrefix("employee:");
    const clients = await kv.getByPrefix("client:");
    const projects = await kv.getByPrefix("assignment:");

    // Calculate active users (users who logged in within last 30 days - simplified to active status)
    const activeUsers = (users || []).filter((u: any) => u.status === 'active').length;

    // Calculate revenue (simplified - based on subscription plans)
    const planPricing: Record<string, number> = {
      free: 0,
      starter: 29,
      professional: 99,
      enterprise: 299,
    };

    let totalRevenue = 0;
    let monthlyRevenue = 0;

    (organizations || []).forEach((org: any) => {
      const price = planPricing[org.subscriptionPlan] || 0;
      monthlyRevenue += price;
      // Estimate total revenue based on how long they've been customers
      const monthsSince = Math.max(1, Math.floor((Date.now() - new Date(org.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
      totalRevenue += price * monthsSince;
    });

    const metrics = {
      totalOrganizations: (organizations || []).length,
      totalUsers: (users || []).length,
      activeUsers: activeUsers,
      totalEmployees: (employees || []).length,
      totalClients: (clients || []).length,
      totalProjects: (projects || []).length,
      totalRevenue: totalRevenue,
      monthlyRevenue: monthlyRevenue,
    };

    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    return c.json({ error: "Failed to fetch platform metrics", details: String(error) }, 500);
  }
});

// Get system health metrics
app.get("/make-server-f8517b5b/product-admin/system-health", async (c) => {
  try {
    // Simulated system health metrics
    // In a real production environment, these would come from monitoring tools
    const health = {
      status: "healthy" as const,
      uptime: 99.99,
      responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
      cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
      memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
      diskUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
      databaseConnections: Math.floor(Math.random() * 20) + 10, // 10-30
      apiCalls: Math.floor(Math.random() * 1000) + 500, // 500-1500 calls
      errorRate: Math.random() * 0.5, // 0-0.5%
    };

    return c.json(health);
  } catch (error) {
    console.error("Error fetching system health:", error);
    return c.json({ error: "Failed to fetch system health", details: String(error) }, 500);
  }
});

// Get all organizations with detailed info
app.get("/make-server-f8517b5b/product-admin/organizations", async (c) => {
  try {
    const organizations = await kv.getByPrefix("organization:");
    const users = await kv.getByPrefix("user:");
    const employees = await kv.getByPrefix("employee:");

    const planPricing: Record<string, number> = {
      free: 0,
      starter: 29,
      professional: 99,
      enterprise: 299,
    };

    const organizationData = (organizations || []).map((org: any) => {
      // Count users in this organization
      const orgUsers = (users || []).filter((u: any) => u.organizationId === org.id);
      const orgEmployees = (employees || []).filter((e: any) => e.organizationId === org.id);

      return {
        id: org.id,
        name: org.name, // This is the company name from signup
        subscriptionPlan: org.subscriptionPlan || 'free',
        userCount: orgUsers.length,
        employeeCount: orgEmployees.length,
        status: org.status || 'active',
        createdAt: org.createdAt,
        monthlyRevenue: planPricing[org.subscriptionPlan] || 0,
        phone: org.phone || '',
        industry: org.industry || '',
        companySize: org.companySize || '',
      };
    });

    // Sort by creation date (newest first)
    organizationData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json(organizationData);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return c.json({ error: "Failed to fetch organizations", details: String(error) }, 500);
  }
});

// Get subscription metrics (count by plan)
app.get("/make-server-f8517b5b/product-admin/subscription-metrics", async (c) => {
  try {
    const organizations = await kv.getByPrefix("organization:");

    const metrics = {
      free: 0,
      starter: 0,
      professional: 0,
      enterprise: 0,
    };

    (organizations || []).forEach((org: any) => {
      const plan = org.subscriptionPlan || 'free';
      if (plan in metrics) {
        metrics[plan as keyof typeof metrics]++;
      }
    });

    return c.json(metrics);
  } catch (error) {
    console.error("Error fetching subscription metrics:", error);
    return c.json({ error: "Failed to fetch subscription metrics", details: String(error) }, 500);
  }
});

// ============================================
// EXTERNAL INTEGRATIONS ENDPOINTS
// ============================================

// Get all external integrations
app.get("/make-server-f8517b5b/external-integrations", async (c) => {
  try {
    const integrations = await kv.getByPrefix("external-integration:");
    return c.json({ integrations: integrations || [] });
  } catch (error) {
    console.error("Error fetching external integrations:", error);
    return c.json({ error: "Failed to fetch external integrations", details: String(error) }, 500);
  }
});

// Get a specific external integration
app.get("/make-server-f8517b5b/external-integrations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const integration = await kv.get(`external-integration:${id}`);
    
    if (!integration) {
      return c.json({ error: "Integration not found" }, 404);
    }
    
    return c.json({ integration });
  } catch (error) {
    console.error("Error fetching external integration:", error);
    return c.json({ error: "Failed to fetch external integration", details: String(error) }, 500);
  }
});

// Create a new external integration
app.post("/make-server-f8517b5b/external-integrations", async (c) => {
  try {
    const body = await c.req.json();
    const { module, provider, enabled, customUrl } = body;

    if (!module || !provider) {
      return c.json({ error: "Missing required fields: module, provider" }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const integration = {
      id,
      module,
      provider,
      enabled: enabled || false,
      customUrl: customUrl || '',
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`external-integration:${id}`, integration);

    return c.json({ integration }, 201);
  } catch (error) {
    console.error("Error creating external integration:", error);
    return c.json({ error: "Failed to create external integration", details: String(error) }, 500);
  }
});

// Update an external integration
app.put("/make-server-f8517b5b/external-integrations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const integration = await kv.get(`external-integration:${id}`);
    if (!integration) {
      return c.json({ error: "Integration not found" }, 404);
    }

    const now = new Date().toISOString();

    const updatedIntegration = {
      ...integration,
      ...body,
      id, // Preserve ID
      updatedAt: now,
    };

    await kv.set(`external-integration:${id}`, updatedIntegration);

    return c.json({ integration: updatedIntegration });
  } catch (error) {
    console.error("Error updating external integration:", error);
    return c.json({ error: "Failed to update external integration", details: String(error) }, 500);
  }
});

// Delete an external integration
app.delete("/make-server-f8517b5b/external-integrations/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const integration = await kv.get(`external-integration:${id}`);
    if (!integration) {
      return c.json({ error: "Integration not found" }, 404);
    }

    await kv.del(`external-integration:${id}`);

    return c.json({ success: true, message: "Integration deleted successfully" });
  } catch (error) {
    console.error("Error deleting external integration:", error);
    return c.json({ error: "Failed to delete external integration", details: String(error) }, 500);
  }
});

// ============================================
// DOCUMENT MANAGEMENT ENDPOINTS
// ============================================

// Get all documents for an employee
app.get("/make-server-f8517b5b/documents", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    
    if (!employeeId) {
      return c.json({ error: "employeeId is required" }, 400);
    }

    console.log(`[Documents API] Fetching documents for employee: ${employeeId}`);
    
    const allDocuments = await kv.getByPrefix("document:");
    const employeeDocuments = (allDocuments || []).filter((doc: any) => doc.employeeId === employeeId);
    
    console.log(`[Documents API] Found ${employeeDocuments.length} documents`);
    
    return c.json({ documents: employeeDocuments });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return c.json({ error: "Failed to fetch documents", details: String(error) }, 500);
  }
});

// Get all document requests for an employee
app.get("/make-server-f8517b5b/document-requests", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    
    if (!employeeId) {
      return c.json({ error: "employeeId is required" }, 400);
    }

    console.log(`[Document Requests API] Fetching requests for employee: ${employeeId}`);
    
    const allRequests = await kv.getByPrefix("document-request:");
    const employeeRequests = (allRequests || []).filter((req: any) => req.employeeId === employeeId);
    
    console.log(`[Document Requests API] Found ${employeeRequests.length} requests`);
    
    return c.json({ requests: employeeRequests });
  } catch (error) {
    console.error("Error fetching document requests:", error);
    return c.json({ error: "Failed to fetch document requests", details: String(error) }, 500);
  }
});

// Upload employee document (work authorization, etc.)
app.post("/make-server-f8517b5b/upload-employee-document", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const employeeId = formData.get('employeeId') as string;
    const documentType = formData.get('documentType') as string;
    
    if (!file || !employeeId || !documentType) {
      console.error('[Upload Document] Missing required fields:', { file: !!file, employeeId, documentType });
      return c.json({ error: "Missing required fields: file, employeeId, documentType" }, 400);
    }
    
    console.log(`[Upload Document] Uploading ${documentType} for employee ${employeeId}`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: "File size exceeds 10MB limit" }, 400);
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Only PDF, JPG, and PNG are allowed" }, 400);
    }
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 for storage (in a real app, you'd use Supabase Storage)
    // Handle large files by converting in chunks to avoid stack overflow
    let base64 = '';
    try {
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64 += String.fromCharCode.apply(null, Array.from(chunk));
      }
      base64 = btoa(base64);
    } catch (conversionError) {
      console.error('[Upload Document] Error converting file to base64:', conversionError);
      return c.json({ error: 'Failed to process file. The file may be too large or corrupted.' }, 500);
    }
    
    // Store document metadata
    const documentId = crypto.randomUUID();
    const document = {
      id: documentId,
      employeeId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileData: base64, // In production, this would be a storage URL
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'employee' // Could be tracked from auth
    };
    
    await kv.set(`employee-document:${documentId}`, document);
    
    // Also add to employee's document list
    const existingDocs = await kv.getByPrefix(`employee-document:`);
    const employeeDocs = (existingDocs || []).filter((doc: any) => doc.employeeId === employeeId);
    
    console.log(`[Upload Document] Document uploaded successfully: ${documentId}`);
    
    return c.json({ 
      success: true, 
      documentId,
      url: documentId, // Return document ID as URL reference
      message: "Document uploaded successfully"
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return c.json({ error: "Failed to upload document", details: String(error) }, 500);
  }
});

// Get employee documents
app.get("/make-server-f8517b5b/employee-documents/:employeeId", async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    
    console.log(`[Get Documents] Fetching documents for employee: ${employeeId}`);
    
    const allDocs = await kv.getByPrefix("employee-document:");
    const employeeDocs = (allDocs || []).filter((doc: any) => doc.employeeId === employeeId);
    
    // Don't send the full file data in the list, just metadata
    const docsMetadata = employeeDocs.map((doc: any) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedBy
    }));
    
    console.log(`[Get Documents] Found ${docsMetadata.length} documents`);
    
    return c.json({ documents: docsMetadata });
  } catch (error) {
    console.error("Error fetching employee documents:", error);
    return c.json({ error: "Failed to fetch documents", details: String(error) }, 500);
  }
});

// Download specific document
app.get("/make-server-f8517b5b/employee-documents/:employeeId/:documentId", async (c) => {
  try {
    const documentId = c.req.param("documentId");
    
    console.log(`[Download Document] Fetching document: ${documentId}`);
    
    const document = await kv.get(`employee-document:${documentId}`);
    
    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }
    
    // Convert base64 back to binary
    const binaryString = atob(document.fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Response(bytes, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize.toString()
      }
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return c.json({ error: "Failed to download document", details: String(error) }, 500);
  }
});

// ==================== HR Calendar Endpoints ====================

// Get all holidays
app.get("/make-server-f8517b5b/hr-calendar/holidays", async (c) => {
  try {
    const holidays = await kv.getByPrefix("holiday:");
    return c.json({ holidays: holidays || [] });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return c.json({ error: "Failed to fetch holidays", details: String(error) }, 500);
  }
});

// Add a new holiday
app.post("/make-server-f8517b5b/hr-calendar/holidays", async (c) => {
  try {
    const body = await c.req.json();
    const { name, date, description } = body;
    
    if (!name || !date) {
      return c.json({ error: "Missing required fields: name, date" }, 400);
    }
    
    // Parse date without timezone conversion (date comes as "YYYY-MM-DD")
    const [year, month, day] = date.split('-').map(Number);
    const holidayDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    const holidayId = crypto.randomUUID();
    const holiday = {
      id: holidayId,
      type: 'holiday' as const,
      title: name,
      date: holidayDate.toISOString(),
      description,
      color: 'bg-blue-500',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`holiday:${holidayId}`, holiday);
    
    console.log(`[HR Calendar] Holiday created: ${name} on ${date}`);
    return c.json({ holiday });
  } catch (error) {
    console.error("Error creating holiday:", error);
    return c.json({ error: "Failed to create holiday", details: String(error) }, 500);
  }
});

// Delete a holiday
app.delete("/make-server-f8517b5b/hr-calendar/holidays/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const holiday = await kv.get(`holiday:${id}`);
    if (!holiday) {
      return c.json({ error: "Holiday not found" }, 404);
    }
    
    await kv.del(`holiday:${id}`);
    
    console.log(`[HR Calendar] Holiday deleted: ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return c.json({ error: "Failed to delete holiday", details: String(error) }, 500);
  }
});

// Initialize American holidays for a specific year
app.post("/make-server-f8517b5b/hr-calendar/initialize-us-holidays", async (c) => {
  try {
    const body = await c.req.json();
    const year = body.year || new Date().getFullYear();
    const force = body.force || false; // Allow forcing re-initialization
    
    // Helper function to calculate nth weekday of month (for holidays like Labor Day)
    const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number) => {
      const firstDay = new Date(Date.UTC(year, month, 1, 12, 0, 0, 0));
      const firstWeekday = firstDay.getUTCDay();
      const offset = (weekday - firstWeekday + 7) % 7;
      const date = 1 + offset + (n - 1) * 7;
      return new Date(Date.UTC(year, month, date, 12, 0, 0, 0)); // Use UTC to avoid timezone issues
    };
    
    // Helper function to get last weekday of month
    const getLastWeekdayOfMonth = (year: number, month: number, weekday: number) => {
      const lastDay = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0, 0));
      const lastDate = lastDay.getUTCDate();
      const lastWeekday = lastDay.getUTCDay();
      const offset = (lastWeekday - weekday + 7) % 7;
      return new Date(Date.UTC(year, month, lastDate - offset, 12, 0, 0, 0)); // Use UTC to avoid timezone issues
    };
    
    // Define US Federal Holidays and common observances
    const holidays = [
      {
        name: "New Year's Day",
        date: new Date(Date.UTC(year, 0, 1, 12, 0, 0, 0)),
        description: "Federal Holiday - First day of the year",
        color: "bg-blue-500",
        category: "federal"
      },
      {
        name: "Martin Luther King Jr. Day",
        date: getNthWeekdayOfMonth(year, 0, 1, 3), // 3rd Monday in January
        description: "Federal Holiday - Honors civil rights leader Martin Luther King Jr.",
        color: "bg-purple-500",
        category: "federal"
      },
      {
        name: "Presidents' Day",
        date: getNthWeekdayOfMonth(year, 1, 1, 3), // 3rd Monday in February
        description: "Federal Holiday - Honors all US presidents",
        color: "bg-red-500",
        category: "federal"
      },
      {
        name: "Memorial Day",
        date: getLastWeekdayOfMonth(year, 4, 1), // Last Monday in May
        description: "Federal Holiday - Honors military personnel who died in service",
        color: "bg-blue-700",
        category: "federal"
      },
      {
        name: "Juneteenth",
        date: new Date(Date.UTC(year, 5, 19, 12, 0, 0, 0)),
        description: "Federal Holiday - Commemorates the end of slavery in the US",
        color: "bg-green-600",
        category: "federal"
      },
      {
        name: "Independence Day",
        date: new Date(Date.UTC(year, 6, 4, 12, 0, 0, 0)),
        description: "Federal Holiday - Celebrates the Declaration of Independence",
        color: "bg-red-600",
        category: "federal"
      },
      {
        name: "Labor Day",
        date: getNthWeekdayOfMonth(year, 8, 1, 1), // 1st Monday in September
        description: "Federal Holiday - Honors American workers",
        color: "bg-orange-500",
        category: "federal"
      },
      {
        name: "Columbus Day",
        date: getNthWeekdayOfMonth(year, 9, 1, 2), // 2nd Monday in October
        description: "Federal Holiday - Commemorates Christopher Columbus's arrival",
        color: "bg-teal-500",
        category: "federal"
      },
      {
        name: "Veterans Day",
        date: new Date(Date.UTC(year, 10, 11, 12, 0, 0, 0)),
        description: "Federal Holiday - Honors military veterans",
        color: "bg-blue-800",
        category: "federal"
      },
      {
        name: "Thanksgiving Day",
        date: getNthWeekdayOfMonth(year, 10, 4, 4), // 4th Thursday in November
        description: "Federal Holiday - Day of giving thanks",
        color: "bg-orange-600",
        category: "federal"
      },
      {
        name: "Christmas Day",
        date: new Date(Date.UTC(year, 11, 25, 12, 0, 0, 0)),
        description: "Federal Holiday - Christian celebration of Jesus Christ's birth",
        color: "bg-green-700",
        category: "federal"
      },
      // Popular observances (not federal holidays)
      {
        name: "Valentine's Day",
        date: new Date(Date.UTC(year, 1, 14, 12, 0, 0, 0)),
        description: "Popular observance - Day of love and affection",
        color: "bg-pink-500",
        category: "observance"
      },
      {
        name: "St. Patrick's Day",
        date: new Date(Date.UTC(year, 2, 17, 12, 0, 0, 0)),
        description: "Popular observance - Celebrates Irish culture",
        color: "bg-green-500",
        category: "observance"
      },
      {
        name: "Earth Day",
        date: new Date(Date.UTC(year, 3, 22, 12, 0, 0, 0)),
        description: "Environmental observance - Promotes environmental protection",
        color: "bg-green-400",
        category: "observance"
      },
      {
        name: "Cinco de Mayo",
        date: new Date(Date.UTC(year, 4, 5, 12, 0, 0, 0)),
        description: "Cultural observance - Commemorates Mexican victory",
        color: "bg-red-400",
        category: "observance"
      },
      {
        name: "Mother's Day",
        date: getNthWeekdayOfMonth(year, 4, 0, 2), // 2nd Sunday in May
        description: "Popular observance - Honors mothers and motherhood",
        color: "bg-pink-400",
        category: "observance"
      },
      {
        name: "Father's Day",
        date: getNthWeekdayOfMonth(year, 5, 0, 3), // 3rd Sunday in June
        description: "Popular observance - Honors fathers and fatherhood",
        color: "bg-blue-400",
        category: "observance"
      },
      {
        name: "Halloween",
        date: new Date(Date.UTC(year, 9, 31, 12, 0, 0, 0)),
        description: "Popular observance - Costume parties and trick-or-treating",
        color: "bg-orange-700",
        category: "observance"
      },
      {
        name: "Black Friday",
        date: new Date(getNthWeekdayOfMonth(year, 10, 4, 4).getTime() + 86400000), // Day after Thanksgiving
        description: "Shopping event - Major retail sales day",
        color: "bg-gray-700",
        category: "observance"
      },
      {
        name: "New Year's Eve",
        date: new Date(Date.UTC(year, 11, 31, 12, 0, 0, 0)),
        description: "Popular observance - Last day of the year",
        color: "bg-indigo-500",
        category: "observance"
      }
    ];
    
    // Check if holidays for this year already exist
    const existingHolidays = await kv.getByPrefix(`holiday:${year}:`);
    
    if (existingHolidays && existingHolidays.length > 0 && !force) {
      return c.json({ 
        message: `Holidays for ${year} already initialized`,
        count: existingHolidays.length 
      });
    }
    
    // If forcing re-initialization, delete existing holidays for this year
    if (force && existingHolidays && existingHolidays.length > 0) {
      const deleteKeys = existingHolidays.map(h => `holiday:${h.id}`);
      await kv.mdel(deleteKeys);
      console.log(`[HR Calendar] Deleted ${deleteKeys.length} existing holidays for ${year}`);
    }
    
    // Save all holidays to the database
    const savedHolidays = [];
    for (const holiday of holidays) {
      const holidayId = `${year}:${holiday.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const holidayData = {
        id: holidayId,
        type: 'holiday' as const,
        title: holiday.name,
        date: holiday.date.toISOString(),
        description: holiday.description,
        color: holiday.color,
        category: holiday.category,
        year: year,
        createdAt: new Date().toISOString()
      };
      
      await kv.set(`holiday:${holidayId}`, holidayData);
      savedHolidays.push(holidayData);
    }
    
    console.log(`[HR Calendar] Initialized ${savedHolidays.length} US holidays for ${year}`);
    return c.json({ 
      message: `Successfully initialized ${savedHolidays.length} US holidays for ${year}`,
      holidays: savedHolidays,
      count: savedHolidays.length
    });
  } catch (error) {
    console.error("Error initializing US holidays:", error);
    return c.json({ error: "Failed to initialize US holidays", details: String(error) }, 500);
  }
});

// ==================== Calendar Notifications ====================

// Generate notifications for upcoming birthdays, anniversaries, and holidays
app.post("/make-server-f8517b5b/notifications/generate-calendar-alerts", async (c) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysAhead = 7; // Look ahead 7 days
    const notifications = [];

    // Get all employees
    const employees = await kv.getByPrefix("employee:");
    
    // Get all holidays
    const holidays = await kv.getByPrefix("holiday:");
    
    // Get all HR users to notify
    const users = await kv.getByPrefix("user:");
    const hrUsers = users.filter(u => u.role === 'hr' || u.role === 'admin');

    // Check for upcoming birthdays
    for (const employee of employees) {
      if (employee.dateOfBirth) {
        // Parse date without timezone conversion
        const [dobYear, dobMonth, dobDay] = employee.dateOfBirth.split('-').map(Number);
        const thisYearBirthday = new Date(now.getFullYear(), dobMonth - 1, dobDay);
        
        // Calculate days until birthday
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          const age = now.getFullYear() - dob.getFullYear();
          
          for (const hrUser of hrUsers) {
            // Check if notification already exists
            const existingNotifs = await kv.getByPrefix("notification:");
            const alreadyExists = existingNotifs.some(n => 
              n.userId === hrUser.id && 
              n.relatedEntityId === employee.id && 
              n.relatedEntityType === 'birthday' &&
              n.title.includes(employee.firstName) &&
              new Date(n.createdAt).toDateString() === now.toDateString()
            );
            
            if (!alreadyExists) {
              const notificationId = crypto.randomUUID();
              const notification = {
                id: notificationId,
                userId: hrUser.id,
                type: "info",
                category: "Calendar",
                title: `Upcoming Birthday: ${employee.firstName} ${employee.lastName}`,
                message: daysUntil === 0 
                  ? `Today is ${employee.firstName} ${employee.lastName}'s birthday! They turn ${age} today. 🎂`
                  : daysUntil === 1
                  ? `Tomorrow is ${employee.firstName} ${employee.lastName}'s birthday! They will turn ${age}.`
                  : `${employee.firstName} ${employee.lastName}'s birthday is in ${daysUntil} days (${thisYearBirthday.toLocaleDateString()}). They will turn ${age}.`,
                priority: daysUntil === 0 ? "high" : daysUntil <= 3 ? "medium" : "low",
                read: false,
                relatedEntityId: employee.id,
                relatedEntityType: "birthday",
                createdAt: now.toISOString(),
              };
              
              await kv.set(`notification:${notificationId}`, notification);
              notifications.push(notification);
            }
          }
        }
      }
    }

    // Check for upcoming work anniversaries
    for (const employee of employees) {
      if (employee.startDate) {
        const startDate = new Date(employee.startDate);
        const thisYearAnniversary = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());
        
        // Calculate days until anniversary
        const daysUntil = Math.ceil((thisYearAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          const yearsOfService = now.getFullYear() - startDate.getFullYear();
          
          // Only notify for anniversaries (not start date in first year)
          if (yearsOfService > 0) {
            for (const hrUser of hrUsers) {
              // Check if notification already exists
              const existingNotifs = await kv.getByPrefix("notification:");
              const alreadyExists = existingNotifs.some(n => 
                n.userId === hrUser.id && 
                n.relatedEntityId === employee.id && 
                n.relatedEntityType === 'anniversary' &&
                n.title.includes(employee.firstName) &&
                new Date(n.createdAt).toDateString() === now.toDateString()
              );
              
              if (!alreadyExists) {
                const notificationId = crypto.randomUUID();
                const notification = {
                  id: notificationId,
                  userId: hrUser.id,
                  type: "info",
                  category: "Calendar",
                  title: `Upcoming Work Anniversary: ${employee.firstName} ${employee.lastName}`,
                  message: daysUntil === 0
                    ? `Today is ${employee.firstName} ${employee.lastName}'s work anniversary! They have been with the company for ${yearsOfService} ${yearsOfService === 1 ? 'year' : 'years'}. 🎉`
                    : daysUntil === 1
                    ? `Tomorrow is ${employee.firstName} ${employee.lastName}'s work anniversary! They will have been with the company for ${yearsOfService} ${yearsOfService === 1 ? 'year' : 'years'}.`
                    : `${employee.firstName} ${employee.lastName}'s work anniversary is in ${daysUntil} days (${thisYearAnniversary.toLocaleDateString()}). They will have been with the company for ${yearsOfService} ${yearsOfService === 1 ? 'year' : 'years'}.`,
                  priority: daysUntil === 0 ? "high" : daysUntil <= 3 ? "medium" : "low",
                  read: false,
                  relatedEntityId: employee.id,
                  relatedEntityType: "anniversary",
                  createdAt: now.toISOString(),
                };
                
                await kv.set(`notification:${notificationId}`, notification);
                notifications.push(notification);
              }
            }
          }
        }
      }
    }

    // Check for upcoming holidays
    for (const holiday of holidays) {
      if (holiday.date) {
        const holidayDate = new Date(holiday.date);
        const thisYearHoliday = new Date(now.getFullYear(), holidayDate.getMonth(), holidayDate.getDate());
        
        // Calculate days until holiday
        const daysUntil = Math.ceil((thisYearHoliday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          for (const hrUser of hrUsers) {
            // Check if notification already exists
            const existingNotifs = await kv.getByPrefix("notification:");
            const alreadyExists = existingNotifs.some(n => 
              n.userId === hrUser.id && 
              n.relatedEntityId === holiday.id && 
              n.relatedEntityType === 'holiday' &&
              new Date(n.createdAt).toDateString() === now.toDateString()
            );
            
            if (!alreadyExists) {
              const notificationId = crypto.randomUUID();
              const notification = {
                id: notificationId,
                userId: hrUser.id,
                type: "info",
                category: "Calendar",
                title: `Upcoming Holiday: ${holiday.name}`,
                message: daysUntil === 0
                  ? `Today is ${holiday.name}! ${holiday.description || ''}`
                  : daysUntil === 1
                  ? `Tomorrow is ${holiday.name}. ${holiday.description || ''}`
                  : `${holiday.name} is in ${daysUntil} days (${thisYearHoliday.toLocaleDateString()}). ${holiday.description || ''}`,
                priority: daysUntil === 0 ? "high" : daysUntil <= 3 ? "medium" : "low",
                read: false,
                relatedEntityId: holiday.id,
                relatedEntityType: "holiday",
                createdAt: now.toISOString(),
              };
              
              await kv.set(`notification:${notificationId}`, notification);
              notifications.push(notification);
            }
          }
        }
      }
    }

    // Check for expiring business licenses
    const businessLicenses = await kv.getByPrefix("business_license:");
    for (const license of businessLicenses) {
      if (license.expirationDate) {
        const expirationDate = new Date(license.expirationDate);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Alert for licenses expiring in the next 30 days OR expired in the past 30 days (overdue)
        if (daysUntilExpiration >= -30 && daysUntilExpiration <= 30) {
          for (const hrUser of hrUsers) {
            const existingNotifs = await kv.getByPrefix("notification:");
            
            // For overdue items, always update; for future items, check today only
            const alreadyExists = existingNotifs.some(n => 
              n.userId === hrUser.id && 
              n.relatedEntityId === license.id && 
              n.relatedEntityType === 'business_license' &&
              (daysUntilExpiration < 0 ? true : new Date(n.createdAt).toDateString() === now.toDateString())
            );
            
            if (!alreadyExists || daysUntilExpiration < 0) {
              // Delete old notification for overdue items
              if (daysUntilExpiration < 0) {
                const oldNotif = existingNotifs.find(n => 
                  n.userId === hrUser.id && 
                  n.relatedEntityId === license.id && 
                  n.relatedEntityType === 'business_license'
                );
                if (oldNotif) {
                  await kv.del(`notification:${oldNotif.id}`);
                }
              }
              const notificationId = crypto.randomUUID();
              const notification = {
                id: notificationId,
                userId: hrUser.id,
                type: daysUntilExpiration < 0 || daysUntilExpiration <= 7 ? "alert" : "reminder",
                category: "Licensing",
                title: daysUntilExpiration < 0 ? `Business License EXPIRED: ${license.licenseName || license.licenseType}` : `Business License Expiring: ${license.licenseName || license.licenseType}`,
                message: daysUntilExpiration < 0
                  ? `🚨 OVERDUE: Business license "${license.licenseName || license.licenseType}" expired ${Math.abs(daysUntilExpiration)} days ago (${expirationDate.toLocaleDateString()}) for ${license.state}!`
                  : daysUntilExpiration === 0
                  ? `⚠️ Business license "${license.licenseName || license.licenseType}" expires TODAY for ${license.state}!`
                  : daysUntilExpiration === 1
                  ? `⚠️ Business license "${license.licenseName || license.licenseType}" expires TOMORROW for ${license.state}!`
                  : daysUntilExpiration <= 7
                  ? `⚠️ Business license "${license.licenseName || license.licenseType}" expires in ${daysUntilExpiration} days (${expirationDate.toLocaleDateString()}) for ${license.state}.`
                  : `Business license "${license.licenseName || license.licenseType}" expires in ${daysUntilExpiration} days (${expirationDate.toLocaleDateString()}) for ${license.state}.`,
                priority: daysUntilExpiration < 0 ? "urgent" : daysUntilExpiration <= 7 ? "urgent" : daysUntilExpiration <= 14 ? "high" : "medium",
                read: false,
                relatedEntityId: license.id,
                relatedEntityType: "business_license",
                dueDate: license.expirationDate,
                createdAt: now.toISOString(),
              };
              
              await kv.set(`notification:${notificationId}`, notification);
              notifications.push(notification);
            }
          }
        }
      }
    }

    // Check for expiring certifications
    const certifications = await kv.getByPrefix("certification:");
    for (const cert of certifications) {
      if (cert.expirationDate) {
        const expirationDate = new Date(cert.expirationDate);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Alert for certifications expiring in the next 60 days OR expired in the past 30 days (overdue)
        if (daysUntilExpiration >= -30 && daysUntilExpiration <= 60) {
          for (const hrUser of hrUsers) {
            const existingNotifs = await kv.getByPrefix("notification:");
            
            // For overdue items, check if notification exists at all (not just today)
            // For future items, only check today to avoid duplicates
            const alreadyExists = existingNotifs.some(n => 
              n.userId === hrUser.id && 
              n.relatedEntityId === cert.id && 
              n.relatedEntityType === 'certification' &&
              (daysUntilExpiration < 0 ? true : new Date(n.createdAt).toDateString() === now.toDateString())
            );
            
            if (!alreadyExists || daysUntilExpiration < 0) {
              // For overdue items, delete the old notification and create a new one with updated days count
              if (daysUntilExpiration < 0) {
                const oldNotif = existingNotifs.find(n => 
                  n.userId === hrUser.id && 
                  n.relatedEntityId === cert.id && 
                  n.relatedEntityType === 'certification'
                );
                if (oldNotif) {
                  await kv.del(`notification:${oldNotif.id}`);
                }
              }
              const notificationId = crypto.randomUUID();
              const employeeName = cert.employeeName || 'Unknown Employee';
              const notification = {
                id: notificationId,
                userId: hrUser.id,
                type: daysUntilExpiration < 0 || daysUntilExpiration <= 14 ? "alert" : "reminder",
                category: "Certifications",
                title: daysUntilExpiration < 0 ? `Certification EXPIRED: ${cert.certificationName}` : `Certification Expiring: ${cert.certificationName}`,
                message: daysUntilExpiration < 0
                  ? `🚨 OVERDUE: ${employeeName}'s certification "${cert.certificationName}" expired ${Math.abs(daysUntilExpiration)} days ago (${expirationDate.toLocaleDateString()})!`
                  : daysUntilExpiration === 0
                  ? `⚠️ ${employeeName}'s certification "${cert.certificationName}" expires TODAY!`
                  : daysUntilExpiration === 1
                  ? `⚠️ ${employeeName}'s certification "${cert.certificationName}" expires TOMORROW!`
                  : daysUntilExpiration <= 14
                  ? `⚠️ ${employeeName}'s certification "${cert.certificationName}" expires in ${daysUntilExpiration} days (${expirationDate.toLocaleDateString()}).`
                  : `${employeeName}'s certification "${cert.certificationName}" expires in ${daysUntilExpiration} days (${expirationDate.toLocaleDateString()}).`,
                priority: daysUntilExpiration < 0 ? "urgent" : daysUntilExpiration <= 14 ? "urgent" : daysUntilExpiration <= 30 ? "high" : "medium",
                read: false,
                relatedEntityId: cert.id,
                relatedEntityType: "certification",
                dueDate: cert.expirationDate,
                createdAt: now.toISOString(),
              };
              
              await kv.set(`notification:${notificationId}`, notification);
              notifications.push(notification);
            }
          }
        }
      }
    }

    // Check for expiring immigration documents (visa, I-9, work authorization)
    for (const employee of employees) {
      // Check visa expiration
      if (employee.visaExpirationDate) {
        const visaExpiration = new Date(employee.visaExpirationDate);
        const daysUntilExpiration = Math.ceil((visaExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Alert for visas expiring in the next 90 days OR expired in the past 30 days (overdue)
        if (daysUntilExpiration >= -30 && daysUntilExpiration <= 90) {
          for (const hrUser of hrUsers) {
            const existingNotifs = await kv.getByPrefix("notification:");
            
            // For overdue items, always update; for future items, check today only
            const alreadyExists = existingNotifs.some(n => 
              n.userId === hrUser.id && 
              n.relatedEntityId === employee.id && 
              n.relatedEntityType === 'visa_expiration' &&
              (daysUntilExpiration < 0 ? true : new Date(n.createdAt).toDateString() === now.toDateString())
            );
            
            if (!alreadyExists || daysUntilExpiration < 0) {
              // Delete old notification for overdue items
              if (daysUntilExpiration < 0) {
                const oldNotif = existingNotifs.find(n => 
                  n.userId === hrUser.id && 
                  n.relatedEntityId === employee.id && 
                  n.relatedEntityType === 'visa_expiration'
                );
                if (oldNotif) {
                  await kv.del(`notification:${oldNotif.id}`);
                }
              }
              const notificationId = crypto.randomUUID();
              const notification = {
                id: notificationId,
                userId: hrUser.id,
                type: daysUntilExpiration < 0 || daysUntilExpiration <= 30 ? "alert" : "reminder",
                category: "Immigration",
                title: daysUntilExpiration < 0 ? `Visa EXPIRED: ${employee.firstName} ${employee.lastName}` : `Visa Expiring: ${employee.firstName} ${employee.lastName}`,
                message: daysUntilExpiration < 0
                  ? `🚨 OVERDUE: ${employee.firstName} ${employee.lastName}'s ${employee.visaType || 'visa'} expired ${Math.abs(daysUntilExpiration)} days ago (${visaExpiration.toLocaleDateString()})!`
                  : daysUntilExpiration === 0
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s ${employee.visaType || 'visa'} expires TODAY!`
                  : daysUntilExpiration === 1
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s ${employee.visaType || 'visa'} expires TOMORROW!`
                  : daysUntilExpiration <= 30
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s ${employee.visaType || 'visa'} expires in ${daysUntilExpiration} days (${visaExpiration.toLocaleDateString()}).`
                  : `${employee.firstName} ${employee.lastName}'s ${employee.visaType || 'visa'} expires in ${daysUntilExpiration} days (${visaExpiration.toLocaleDateString()}).`,
                priority: daysUntilExpiration < 0 ? "urgent" : daysUntilExpiration <= 30 ? "urgent" : daysUntilExpiration <= 60 ? "high" : "medium",
                read: false,
                relatedEntityId: employee.id,
                relatedEntityType: "visa_expiration",
                dueDate: employee.visaExpirationDate,
                createdAt: now.toISOString(),
              };
              
              await kv.set(`notification:${notificationId}`, notification);
              notifications.push(notification);
            }
          }
        }
      }

      // Check I-9 expiration
      if (employee.i9ExpirationDate) {
        const i9Expiration = new Date(employee.i9ExpirationDate);
        const daysUntilExpiration = Math.ceil((i9Expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Alert for I-9 expiring in the next 60 days OR expired in the past 30 days (overdue)
        if (daysUntilExpiration >= -30 && daysUntilExpiration <= 60) {
          for (const hrUser of hrUsers) {
            const existingNotifs = await kv.getByPrefix("notification:");
            
            // For overdue items, always update; for future items, check today only
            const alreadyExists = existingNotifs.some(n => 
              n.userId === hrUser.id && 
              n.relatedEntityId === employee.id && 
              n.relatedEntityType === 'i9_expiration' &&
              (daysUntilExpiration < 0 ? true : new Date(n.createdAt).toDateString() === now.toDateString())
            );
            
            if (!alreadyExists || daysUntilExpiration < 0) {
              // Delete old notification for overdue items
              if (daysUntilExpiration < 0) {
                const oldNotif = existingNotifs.find(n => 
                  n.userId === hrUser.id && 
                  n.relatedEntityId === employee.id && 
                  n.relatedEntityType === 'i9_expiration'
                );
                if (oldNotif) {
                  await kv.del(`notification:${oldNotif.id}`);
                }
              }
              const notificationId = crypto.randomUUID();
              const notification = {
                id: notificationId,
                userId: hrUser.id,
                type: daysUntilExpiration < 0 || daysUntilExpiration <= 14 ? "alert" : "reminder",
                category: "Immigration",
                title: daysUntilExpiration < 0 ? `I-9 EXPIRED: ${employee.firstName} ${employee.lastName}` : `I-9 Expiring: ${employee.firstName} ${employee.lastName}`,
                message: daysUntilExpiration < 0
                  ? `🚨 OVERDUE: ${employee.firstName} ${employee.lastName}'s I-9 document expired ${Math.abs(daysUntilExpiration)} days ago (${i9Expiration.toLocaleDateString()})!`
                  : daysUntilExpiration === 0
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s I-9 document expires TODAY!`
                  : daysUntilExpiration === 1
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s I-9 document expires TOMORROW!`
                  : daysUntilExpiration <= 14
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s I-9 document expires in ${daysUntilExpiration} days (${i9Expiration.toLocaleDateString()}).`
                  : `${employee.firstName} ${employee.lastName}'s I-9 document expires in ${daysUntilExpiration} days (${i9Expiration.toLocaleDateString()}).`,
                priority: daysUntilExpiration < 0 ? "urgent" : daysUntilExpiration <= 14 ? "urgent" : daysUntilExpiration <= 30 ? "high" : "medium",
                read: false,
                relatedEntityId: employee.id,
                relatedEntityType: "i9_expiration",
                dueDate: employee.i9ExpirationDate,
                createdAt: now.toISOString(),
              };
              
              await kv.set(`notification:${notificationId}`, notification);
              notifications.push(notification);
            }
          }
        }
      }

      // Check work authorization expiration
      if (employee.workAuthorizationExpiry) {
        const workAuthExpiration = new Date(employee.workAuthorizationExpiry);
        const daysUntilExpiration = Math.ceil((workAuthExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Alert for work authorization expiring in the next 90 days OR expired in the past 30 days (overdue)
        if (daysUntilExpiration >= -30 && daysUntilExpiration <= 90) {
          for (const hrUser of hrUsers) {
            const existingNotifs = await kv.getByPrefix("notification:");
            
            // For overdue items, always update; for future items, check today only
            const alreadyExists = existingNotifs.some(n => 
              n.userId === hrUser.id && 
              n.relatedEntityId === employee.id && 
              n.relatedEntityType === 'work_auth_expiration' &&
              (daysUntilExpiration < 0 ? true : new Date(n.createdAt).toDateString() === now.toDateString())
            );
            
            if (!alreadyExists || daysUntilExpiration < 0) {
              // Delete old notification for overdue items
              if (daysUntilExpiration < 0) {
                const oldNotif = existingNotifs.find(n => 
                  n.userId === hrUser.id && 
                  n.relatedEntityId === employee.id && 
                  n.relatedEntityType === 'work_auth_expiration'
                );
                if (oldNotif) {
                  await kv.del(`notification:${oldNotif.id}`);
                }
              }
              const notificationId = crypto.randomUUID();
              const notification = {
                id: notificationId,
                userId: hrUser.id,
                type: daysUntilExpiration < 0 || daysUntilExpiration <= 30 ? "alert" : "reminder",
                category: "Immigration",
                title: daysUntilExpiration < 0 ? `Work Authorization EXPIRED: ${employee.firstName} ${employee.lastName}` : `Work Authorization Expiring: ${employee.firstName} ${employee.lastName}`,
                message: daysUntilExpiration < 0
                  ? `🚨 OVERDUE: ${employee.firstName} ${employee.lastName}'s work authorization expired ${Math.abs(daysUntilExpiration)} days ago (${workAuthExpiration.toLocaleDateString()})!`
                  : daysUntilExpiration === 0
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s work authorization expires TODAY!`
                  : daysUntilExpiration === 1
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s work authorization expires TOMORROW!`
                  : daysUntilExpiration <= 30
                  ? `⚠️ ${employee.firstName} ${employee.lastName}'s work authorization expires in ${daysUntilExpiration} days (${workAuthExpiration.toLocaleDateString()}).`
                  : `${employee.firstName} ${employee.lastName}'s work authorization expires in ${daysUntilExpiration} days (${workAuthExpiration.toLocaleDateString()}).`,
                priority: daysUntilExpiration < 0 ? "urgent" : daysUntilExpiration <= 30 ? "urgent" : daysUntilExpiration <= 60 ? "high" : "medium",
                read: false,
                relatedEntityId: employee.id,
                relatedEntityType: "work_auth_expiration",
                dueDate: employee.workAuthorizationExpiry,
                createdAt: now.toISOString(),
              };
              
              await kv.set(`notification:${notificationId}`, notification);
              notifications.push(notification);
            }
          }
        }
      }
    }

    console.log(`[Calendar Notifications] Generated ${notifications.length} notifications (birthdays, anniversaries, holidays, licenses, certifications, immigration)`);
    return c.json({ 
      success: true, 
      generated: notifications.length,
      notifications 
    });
  } catch (error) {
    console.error("Error generating calendar notifications:", error);
    return c.json({ error: "Failed to generate calendar notifications", details: String(error) }, 500);
  }
});

// Create document request
app.post("/make-server-f8517b5b/document-requests", async (c) => {
  try {
    const body = await c.req.json();
    const { employeeId, documentType, description, dueDate, requestedBy, requestedByName, notes } = body;
    if (!employeeId || !documentType || !requestedBy) return c.json({ error: "Missing required fields" }, 400);
    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) return c.json({ error: "Employee not found" }, 404);
    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();
    const documentRequest = { id: requestId, employeeId, employeeName: `${employee.firstName} ${employee.lastName}`, documentType, description, requestedBy, requestedByName, requestedDate: now, dueDate, status: "pending", notes, module: "immigration", createdAt: now, updatedAt: now };
    await kv.set(`document-request:${requestId}`, documentRequest);
    const notificationId = crypto.randomUUID();
    const notification = { id: notificationId, userId: employee.email, type: "document_request", title: "Document Request", message: `${requestedByName} has requested: ${documentType}`, priority: "high", read: false, module: "immigration", actionUrl: "/portal", metadata: { documentRequestId: requestId, documentType, dueDate }, createdAt: now };
    await kv.set(`notification:${notificationId}`, notification);
    return c.json({ documentRequest, message: "Document request created successfully" });
  } catch (error) {
    console.error("Error creating document request:", error);
    return c.json({ error: "Failed to create document request", details: String(error) }, 500);
  }
});

// Get document requests
app.get("/make-server-f8517b5b/document-requests", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    const status = c.req.query("status");
    let requests = await kv.getByPrefix("document-request:") || [];
    if (employeeId) requests = requests.filter((req: any) => req.employeeId === employeeId);
    if (status) requests = requests.filter((req: any) => req.status === status);
    requests.sort((a: any, b: any) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
    return c.json({ documentRequests: requests });
  } catch (error) {
    console.error("Error fetching document requests:", error);
    return c.json({ error: "Failed to fetch document requests", details: String(error) }, 500);
  }
});

// Upload document
app.post("/make-server-f8517b5b/document-requests/:id/upload", async (c) => {
  try {
    const requestId = c.req.param("id");
    const body = await c.req.json();
    const { fileUrl, fileName } = body;
    if (!fileUrl) return c.json({ error: "File URL is required" }, 400);
    const request = await kv.get(`document-request:${requestId}`);
    if (!request) return c.json({ error: "Document request not found" }, 404);
    const now = new Date().toISOString();
    const updatedRequest = { ...request, status: "uploaded", uploadedDate: now, uploadedFileUrl: fileUrl, uploadedFileName: fileName, updatedAt: now };
    await kv.set(`document-request:${requestId}`, updatedRequest);
    const employee = await kv.get(`employee:${request.employeeId}`);
    if (employee) {
      const docId = crypto.randomUUID();
      const document = { id: docId, name: request.documentType, type: request.documentType, fileName: fileName || request.documentType, uploadedBy: employee.email, uploadedDate: now, url: fileUrl, source: "immigration_request", requestId: requestId };
      employee.documents = employee.documents || [];
      employee.documents.push(document);
      employee.updatedAt = now;
      await kv.set(`employee:${employee.id}`, employee);
    }
    const notificationId = crypto.randomUUID();
    const notification = { id: notificationId, userId: request.requestedBy, type: "document_uploaded", title: "Document Uploaded", message: `${request.employeeName} uploaded: ${request.documentType}`, priority: "medium", read: false, module: "immigration", actionUrl: "/immigration", metadata: { documentRequestId: requestId, employeeId: request.employeeId, documentType: request.documentType }, createdAt: now };
    await kv.set(`notification:${notificationId}`, notification);
    return c.json({ documentRequest: updatedRequest, message: "Document uploaded successfully" });
  } catch (error) {
    console.error("Error uploading document:", error);
    return c.json({ error: "Failed to upload document", details: String(error) }, 500);
  }
});

// Cancel document request
app.post("/make-server-f8517b5b/document-requests/:id/cancel", async (c) => {
  try {
    const requestId = c.req.param("id");
    const request = await kv.get(`document-request:${requestId}`);
    if (!request) return c.json({ error: "Document request not found" }, 404);
    const updatedRequest = { ...request, status: "cancelled", updatedAt: new Date().toISOString() };
    await kv.set(`document-request:${requestId}`, updatedRequest);
    return c.json({ documentRequest: updatedRequest, message: "Document request cancelled" });
  } catch (error) {
    console.error("Error cancelling document request:", error);
    return c.json({ error: "Failed to cancel document request", details: String(error) }, 500);
  }
});

// Delete document request
app.delete("/make-server-f8517b5b/document-requests/:id", async (c) => {
  try {
    const requestId = c.req.param("id");
    const request = await kv.get(`document-request:${requestId}`);
    if (!request) return c.json({ error: "Document request not found" }, 404);
    await kv.del(`document-request:${requestId}`);
    return c.json({ message: "Document request deleted successfully" });
  } catch (error) {
    console.error("Error deleting document request:", error);
    return c.json({ error: "Failed to delete document request", details: String(error) }, 500);
  }
});

// ==================== Payroll Management Endpoints ====================

// Delete all timesheets (admin utility)
app.delete("/make-server-f8517b5b/timesheets/clear/all", async (c) => {
  try {
    const timesheets = await kv.getByPrefix("timesheet:");
    
    if (Array.isArray(timesheets)) {
      for (const timesheet of timesheets) {
        if (timesheet && timesheet.id) {
          await kv.del(`timesheet:${timesheet.id}`);
        }
      }
    }
    
    console.log(`[Timesheets] Cleared all timesheet data`);
    return c.json({ success: true, message: "All timesheets cleared" });
  } catch (error) {
    console.error("Error clearing timesheets:", error);
    return c.json({ error: "Failed to clear timesheets", details: String(error) }, 500);
  }
});

// Calculate payroll from approved timesheets
app.post("/make-server-f8517b5b/payroll/calculate", async (c) => {
  try {
    const body = await c.req.json();
    const { year, schedule, cycle } = body;

    console.log(`[Payroll] Calculating payroll for ${year}, ${schedule}, ${cycle}`);

    // Fetch all timesheets using prefix
    const allTimesheets = await kv.getByPrefix("timesheet:");
    console.log(`[Payroll] Found ${allTimesheets?.length || 0} total timesheets`);
    
    const approvedTimesheets = (allTimesheets || []).filter((ts: any) => 
      ts.status === 'approved' || ts.status === 'paid'
    );
    
    console.log(`[Payroll] Found ${approvedTimesheets.length} approved timesheets`);

    if (approvedTimesheets.length === 0) {
      return c.json({ entries: [], message: "No approved timesheets found" });
    }

    // Fetch all employees
    const allEmployees = await kv.getByPrefix("employee:");
    const employees = allEmployees || [];
    
    // Fetch all clients
    const allClients = await kv.getByPrefix("client:");
    const clients = allClients || [];
    
    // Fetch all projects
    const allProjects = await kv.getByPrefix("project:");
    const projects = allProjects || [];

    console.log(`[Payroll] Found ${employees.length} employees, ${clients.length} clients, ${projects.length} projects`);

    // Group timesheets by employee and calculate totals
    const payrollMap = new Map();

    console.log(`[Payroll] Processing ${approvedTimesheets.length} approved timesheets...`);
    
    for (const timesheet of approvedTimesheets) {
      console.log(`[Payroll] Processing timesheet:`, JSON.stringify(timesheet, null, 2));
      
      const employee = employees.find((e: any) => e.id === timesheet.employeeId);
      if (!employee) {
        console.log(`[Payroll] ❌ Skipping timesheet ${timesheet.id} - employee not found: ${timesheet.employeeId}`);
        console.log(`[Payroll] Available employee IDs:`, employees.map((e: any) => e.id));
        continue;
      }
      
      console.log(`[Payroll] ✅ Found employee: ${employee.name} (${employee.id})`);

      // Handle new timesheet format with projects array
      if (timesheet.projects && Array.isArray(timesheet.projects)) {
        console.log(`[Payroll] Timesheet has ${timesheet.projects.length} projects`);
        for (const projectEntry of timesheet.projects) {
          console.log(`[Payroll] Processing project entry:`, projectEntry);
          const project = projects.find((p: any) => p.id === projectEntry.projectId || p.name === projectEntry.projectName);
          const client = project ? clients.find((c: any) => c.id === project.clientId) : null;
          
          const projectName = projectEntry.projectName || project?.name || 'Unknown Project';
          const clientName = client?.name || timesheet.clientName || 'Unknown Client';
          
          const key = `${timesheet.employeeId}-${projectEntry.projectId || projectName}`;
          
          if (!payrollMap.has(key)) {
            payrollMap.set(key, {
              id: crypto.randomUUID(),
              employeeId: timesheet.employeeId,
              employeeNumber: employee.employeeNumber || employee.id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              projectId: projectEntry.projectId || projectName,
              clientProjectName: `${clientName} - ${projectName}`,
              projectStatus: project?.billable ? 'Billable' : 'Billable',
              clientRate: project?.rate || client?.defaultRate || 0,
              totalBillableHours: 0,
              payCheckAmount: 0,
              adjustedAmount: 0,
              timesheetIds: []
            });
          }

          const entry = payrollMap.get(key);
          entry.totalBillableHours += projectEntry.hours || 0;
          entry.timesheetIds.push(timesheet.id);
          console.log(`[Payroll] Added ${projectEntry.hours}h to entry, total now: ${entry.totalBillableHours}h`);
        }
      } 
      // Handle old timesheet format
      else {
        console.log(`[Payroll] Timesheet uses old format (no projects array)`);
        const project = projects.find((p: any) => 
          p.id === timesheet.projectId || 
          p.name === timesheet.projectName || 
          p.name === timesheet.project
        );
        
        const client = project ? 
          clients.find((c: any) => c.id === project.clientId) : 
          clients.find((c: any) => c.name === timesheet.clientName || c.name === timesheet.client);
        
        const projectName = timesheet.projectName || timesheet.project || project?.name || 'Unknown Project';
        const clientName = client?.name || timesheet.clientName || timesheet.client || 'Unknown Client';
        
        const key = `${timesheet.employeeId}-${project?.id || projectName}`;
        
        if (!payrollMap.has(key)) {
          payrollMap.set(key, {
            id: crypto.randomUUID(),
            employeeId: timesheet.employeeId,
            employeeNumber: employee.employeeNumber || employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            projectId: project?.id || projectName,
            clientProjectName: `${clientName} - ${projectName}`,
            projectStatus: project?.billable ? 'Billable' : 'Billable',
            clientRate: project?.rate || client?.defaultRate || 50,
            totalBillableHours: 0,
            payCheckAmount: 0,
            adjustedAmount: 0,
            timesheetIds: []
          });
        }

        const entry = payrollMap.get(key);
        const hours = timesheet.hours || timesheet.regularHours || 0;
        entry.totalBillableHours += hours;
        entry.timesheetIds.push(timesheet.id);
        console.log(`[Payroll] Added ${hours}h to entry for ${projectName}, total now: ${entry.totalBillableHours}h`);
      }
    }
    
    console.log(`[Payroll] Finished processing. PayrollMap has ${payrollMap.size} entries`);

    // Calculate pay check amounts
    const entries = Array.from(payrollMap.values()).map(entry => {
      entry.payCheckAmount = Math.round(entry.totalBillableHours * entry.clientRate * 100) / 100;
      entry.adjustedAmount = entry.payCheckAmount;
      return entry;
    });

    console.log(`[Payroll] Calculated payroll for ${entries.length} employee-project combinations`);
    entries.forEach(e => {
      console.log(`  - ${e.employeeName}: ${e.totalBillableHours}h @ $${e.clientRate}/h = $${e.payCheckAmount}`);
    });

    return c.json({ entries });
  } catch (error) {
    console.error("Error calculating payroll:", error);
    return c.json({ error: "Failed to calculate payroll", details: String(error) }, 500);
  }
});

// Get payroll entries
app.get("/make-server-f8517b5b/payroll/entries", async (c) => {
  try {
    const entries = await kv.get("payroll:entries");
    return c.json({ entries: entries || [] });
  } catch (error) {
    console.error("Error fetching payroll entries:", error);
    return c.json({ error: "Failed to fetch payroll entries", details: String(error) }, 500);
  }
});

// Generate payroll
app.post("/make-server-f8517b5b/payroll/generate", async (c) => {
  try {
    const body = await c.req.json();
    const { entries, year, schedule, cycle } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return c.json({ error: "No entries provided" }, 400);
    }

    // Store payroll run
    const payrollRun = {
      id: crypto.randomUUID(),
      entries,
      year,
      schedule,
      cycle,
      totalAmount: entries.reduce((sum: number, e: any) => sum + e.adjustedAmount, 0),
      generatedAt: new Date().toISOString(),
      status: 'generated'
    };

    // Store in KV
    const existingRuns = await kv.get("payroll:runs") || [];
    await kv.set("payroll:runs", [...existingRuns, payrollRun]);

    console.log(`[Payroll] Generated payroll run for ${entries.length} employees, total: $${payrollRun.totalAmount}`);
    
    return c.json({ 
      success: true, 
      payrollRun,
      message: `Payroll generated for ${entries.length} employee(s)`
    });
  } catch (error) {
    console.error("Error generating payroll:", error);
    return c.json({ error: "Failed to generate payroll", details: String(error) }, 500);
  }
});

// Health check endpoint
app.get("/make-server-f8517b5b/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Server is running"
  });
});

// Root endpoint
app.get("/make-server-f8517b5b", (c) => {
  return c.json({ 
    message: "OneHR API Server",
    version: "1.0.0",
    status: "running"
  });
});

Deno.serve(app.fetch);
