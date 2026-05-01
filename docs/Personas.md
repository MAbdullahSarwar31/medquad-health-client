# User Personas for Medquad Health Solutions Portal

## 1. Dr. Sarah Jenkins (The Client - Radiology Director)

**Background:**  
Dr. Sarah Jenkins is the Director of Radiology at City General Hospital. She oversees a high-volume imaging department with 15 large-scale diagnostic machines (MRI, CT, X-Ray).

**Demographics:**  
- **Age:** 48  
- **Role:** Director of Radiology  
- **Tech Savvy:** Moderate to High  

**Goals:**  
- Maximize machine uptime to ensure patient throughput and revenue generation.  
- Easily report equipment malfunctions without a complex ticketing process.  
- Track the real-time status of repairs to coordinate patient rescheduling efficiently.  

**Pain Points:**  
- Previous systems required her to call a dispatcher, wait on hold, and manually follow up.  
- Lack of visibility into repair progress.  
- Unpredictable equipment failures disrupting the schedule.  

**Use Cases in the Portal:**  
- Using the **Wizard-Based Ticket Creation** to quickly submit a service request with pre-filled equipment details.  
- Viewing the **Kanban Ticket Status Board** on her dashboard to see if a technician is en route.  
- Receiving proactive alerts via the **Predictive Maintenance Engine** when her MRI scanner is exhibiting warning signs.  

---

## 2. Marcus Rivera (The Technician/Employee)

**Background:**  
Marcus is a senior field service engineer for Medquad Health Solutions specializing in MRI and CT scanners. He covers a large metropolitan area and visits 3-4 hospitals daily.

**Demographics:**  
- **Age:** 35  
- **Role:** Field Service Technician  
- **Tech Savvy:** High  

**Goals:**  
- Minimize driving time between hospital sites by prioritizing urgent repairs efficiently.  
- Know exactly what parts are needed before arriving at a job site.  
- Quickly update ticket statuses from the field.  

**Pain Points:**  
- Arriving at a site only to realize the required replacement part is out of stock.  
- Poorly prioritized dispatching leading to unnecessary cross-town driving.  
- Vague problem descriptions from hospital staff making initial diagnosis difficult.  

**Use Cases in the Portal:**  
- Using the **Prioritized Task Queue** on his dashboard, sorted by AI Urgency, to determine his next stop.  
- Viewing the **Parts Availability Indicator** linked to his tickets to ensure he has the right components in his van.  
- Updating ticket status to "Resolved" with a single click after completing a repair.  

---

## 3. Elena Rostova (The Administrator)

**Background:**  
Elena manages the dispatching and overall operations at Medquad HQ. She ensures SLAs (Service Level Agreements) are met and oversees the deployment of technicians.

**Demographics:**  
- **Age:** 42  
- **Role:** Operations Manager (Admin)  
- **Tech Savvy:** High  

**Goals:**  
- Maintain an eagle-eye view of all ongoing service tickets and technician locations.  
- Ensure critical tickets are responded to within the 4-hour SLA window.  
- Analyze system data to optimize maintenance schedules and part inventory.  

**Pain Points:**  
- Manually parsing through hundreds of tickets to identify critical emergencies.  
- Lack of predictive insights resulting in reactive rather than proactive service.  

**Use Cases in the Portal:**  
- Monitoring the **Real-Time Ticket Dashboard** populated by Socket.io to assign technicians to incoming emergencies instantly.  
- Reviewing the **AI Predictive Maintenance Alerts** widget to preemptively schedule service visits before a client's machine actually breaks down.  
- Managing User Roles and updating Equipment Catalogs via the secure Admin routing.
