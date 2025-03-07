// Supabase API configuration
const SUPABASE_URL = 'https://hmqvixspewwahgvbeokk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcXZpeHNwZXd3YWhndmJlb2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNzE3MjcsImV4cCI6MjA1Njg0NzcyN30.20Zi0NdD81eKRV06yZ_G2zdeNxeglSNm8uyZzf9aCrg';

// Function to make authenticated API requests
async function supabaseRequest(endpoint, options = {}) {
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };

    try {
        const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
        }

        return response.headers.get('content-type')?.includes('application/json')
            ? await response.json()
            : null;
    } catch (error) {
        console.error('API Request Error:', error);
        throw new Error(error.message || 'Failed to process the request');
    }
}

// Function to fetch and display all records
async function refreshData() {
    try {
        console.log('Fetching data...');
        const response = await supabaseRequest('/rest/v1/students?select=*', {
            method: 'GET'
        });
        console.log('Fetched data:', response);
        displayRecords(response);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert(`Failed to fetch records: ${error.message}`);
    }
}

// Function to display records in the table
function displayRecords(records) {
    const tbody = document.getElementById('recordsBody');
    tbody.innerHTML = '';

    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td onclick="showDetailPage('${record.id}')" style="cursor: pointer">${record.student_name}</td>
            <td>${record.roll_number || 'N/A'}</td>
            <td>${record.section_id || 'N/A'}</td>
            <td>
                <button onclick="editRecord('${record.id}')">Edit</button>
                <button onclick="deleteRecord('${record.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Function to close edit form
function closeEditForm() {
    const overlay = document.getElementById('editModalOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Function to handle edit form submission
async function handleEditSubmit(event) {
    event.preventDefault();

    const id = event.target.dataset.id; // Retrieve student ID stored in the form dataset

    const updatedData = {
        student_name: document.getElementById('edit_name').value.trim(),
        roll_number: document.getElementById('edit_roll_number').value.trim(),
        section_id: parseInt(document.getElementById('edit_section_id').value) || null
    };

    try {
        await supabaseRequest(`/rest/v1/students?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updatedData)
        });

        closeEditForm();
        refreshData();
    } catch (error) {
        console.error('Error updating record:', error);
        alert(`Failed to update record: ${error.message}`);
    }
}

// Function to handle edit record
async function editRecord(id) {
    const overlay = document.getElementById('editModalOverlay');
    const editForm = document.getElementById('editStudentForm');

    try {
        // Fetch the student data
        const response = await supabaseRequest(`/rest/v1/students?id=eq.${id}&select=*`, {
            method: 'GET'
        });

        if (response.length > 0) {
            const student = response[0];

            // Populate form fields
            document.getElementById('edit_name').value = student.student_name;
            document.getElementById('edit_roll_number').value = student.roll_number || '';
            document.getElementById('edit_section_id').value = student.section_id || '';

            // Store student ID in form dataset
            editForm.dataset.id = id;

            // Show the modal
            overlay.style.display = 'flex';
            setTimeout(() => overlay.style.opacity = '1', 10);

            // Remove previous event listener before adding a new one
            editForm.removeEventListener('submit', handleEditSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
        }
    } catch (error) {
        console.error('Error fetching student data:', error);
        alert(`Failed to fetch student data: ${error.message}`);
    }
}

// Function to delete a record
async function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
        await supabaseRequest(`/rest/v1/students?id=eq.${id}`, {
            method: 'DELETE'
        });

        refreshData();
    } catch (error) {
        console.error('Error deleting record:', error);
        alert(`Failed to delete record: ${error.message}`);
    }
}

// Function to show detail page
function showDetailPage(id) {
    window.location.href = `detail.html?id=${id}`;
}

// Function to show add form modal
function showAddForm() {
    const overlay = document.getElementById('addModalOverlay');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.style.opacity = '1', 10);
}

// Function to close add form modal
function closeAddForm() {
    const overlay = document.getElementById('addModalOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Function to handle adding a new record
async function handleAddSubmit(event) {
    event.preventDefault();

    const newStudent = {
        student_name: document.getElementById('add_name').value.trim(),
        roll_number: document.getElementById('add_roll_number').value.trim(),
        section_id: parseInt(document.getElementById('add_section_id').value) || null
    };

    try {
        await supabaseRequest('/rest/v1/students', {
            method: 'POST',
            body: JSON.stringify(newStudent)
        });

        closeAddForm();
        refreshData();
    } catch (error) {
        console.error('Error adding record:', error);
        alert(`Failed to add record: ${error.message}`);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    refreshData();

    // Attach event listeners
    document.getElementById('addButton').addEventListener('click', showAddForm);
    document.getElementById('refreshButton').addEventListener('click', refreshData);
    document.getElementById('closeButton').addEventListener('click', closeAddForm);
    document.getElementById('editCloseButton').addEventListener('click', closeEditForm);
    document.getElementById('addStudentForm').addEventListener('submit', handleAddSubmit);
});

// Make functions available globally
window.showAddForm = showAddForm;
window.refreshData = refreshData;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.showDetailPage = showDetailPage;
