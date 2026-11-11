const dialog = document.querySelector("#employee-dialog");
const form = document.querySelector("#employee-form");
const list = document.querySelector("#employee-list");
const message = document.querySelector("#message");
let employees = [];

const formatSalary = (value) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 2
}).format(Number(value));

function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = `message ${type}`;
    window.setTimeout(() => { message.className = "message"; }, 3500);
}

function render() {
    document.querySelector("#employee-count").textContent = employees.length;
    const average = employees.length
        ? employees.reduce((sum, employee) => sum + Number(employee.Salary), 0) / employees.length
        : 0;
    document.querySelector("#average-salary").textContent = employees.length ? formatSalary(average) : "—";

    if (!employees.length) {
        list.innerHTML = '<tr><td colspan="4" class="empty">No employees found. Add your first record.</td></tr>';
        return;
    }

    list.innerHTML = employees.map((employee) => `
        <tr>
            <td class="name">${escapeHtml(employee.EmployeeName)}</td>
            <td>${escapeHtml(employee.Department)}</td>
            <td class="salary">${formatSalary(employee.Salary)}</td>
            <td>
                <button class="action" data-edit="${employee.EmployeeID}">Edit</button>
                <button class="action delete" data-delete="${employee.EmployeeID}">Delete</button>
            </td>
        </tr>
    `).join("");
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[character]));
}

async function loadEmployees() {
    try {
        const response = await fetch("/employees");
        if (!response.ok) throw new Error("Unable to load employees");
        employees = await response.json();
        render();
    } catch (error) {
        list.innerHTML = `<tr><td colspan="4" class="empty">${error.message}</td></tr>`;
        showMessage(error.message, "error");
    }
}

function openForm(employee = null) {
    form.reset();
    document.querySelector("#employee-id").value = employee?.EmployeeID || "";
    document.querySelector("#name").value = employee?.EmployeeName || "";
    document.querySelector("#department").value = employee?.Department || "";
    document.querySelector("#salary").value = employee?.Salary || "";
    document.querySelector("#dialog-title").textContent = employee ? "Edit employee" : "Add employee";
    dialog.showModal();
}

document.querySelector("#add-employee").addEventListener("click", () => openForm());
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());

list.addEventListener("click", async (event) => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;
    if (editId) openForm(employees.find((employee) => employee.EmployeeID === Number(editId)));
    if (deleteId && window.confirm("Delete this employee record?")) {
        const response = await fetch(`/employees/${deleteId}`, { method: "DELETE" });
        if (!response.ok) {
            const result = await response.json();
            showMessage(result.error || "Delete failed", "error");
            return;
        }
        showMessage("Employee deleted");
        await loadEmployees();
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.querySelector("#employee-id").value;
    const payload = {
        name: document.querySelector("#name").value.trim(),
        department: document.querySelector("#department").value.trim(),
        salary: Number(document.querySelector("#salary").value)
    };
    const response = await fetch(id ? `/employees/${id}` : "/employees", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const result = await response.json();
        showMessage(result.error || "Save failed", "error");
        return;
    }
    dialog.close();
    showMessage(id ? "Employee updated" : "Employee added");
    await loadEmployees();
});

loadEmployees();
