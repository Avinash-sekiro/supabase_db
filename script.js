// Supabase API configuration
const SUPABASE_URL = 'https://hmqvixspewwahgvbeokk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcXZpeHNwZXd3YWhndmJlb2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNzE3MjcsImV4cCI6MjA1Njg0NzcyN30.20Zi0NdD81eKRV06yZ_G2zdeNxeglSNm8uyZzf9aCrg';
async function supabaseRequest(endpoint, options = {}) {
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    try {
        if (!navigator.onLine) {
            throw new Error('No internet connection. Please check your network connectivity.');
        }

        const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorText;
            } catch {
                errorMessage = errorText;
            }
            throw new Error(`Request failed: ${errorMessage} (Status: ${response.status})`);
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
        const sectionFilter = document.getElementById('sectionFilter').value;
        let endpoint = '/rest/v1/students?select=*,sections:section_id(section_name)';
        
        if (sectionFilter) {
            endpoint += `&section_id=eq.${sectionFilter}`;
        }
        
        const response = await supabaseRequest(endpoint, {
            method: 'GET'
        });
        console.log('Fetched data:', response);
        const sortedRecords = sortStudents(response);
        displayRecords(sortedRecords);
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
                <button onclick="editRecord('${record.id}')" class="action-button">Edit</button>
                <button onclick="deleteRecord('${record.id}')" class="action-button delete">Delete</button>
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
async function loadSchools() {
    try {
        const response = await supabaseRequest('/rest/v1/schools?select=id,name');
        const schoolSelect = document.getElementById('school_select');
        schoolSelect.innerHTML = '<option value="">Select a school</option>';
        response.forEach(school => {
            const option = document.createElement('option');
            option.value = school.id;
            option.textContent = school.name;
            schoolSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading schools:', error);
        alert('Failed to load schools: ' + error.message);
    }
}

// Function to load sections for selected school
async function loadSections(schoolId) {
    try {
        const response = await supabaseRequest(`/rest/v1/sections?school_id=eq.${schoolId}&select=id,section_name`);
        const sectionIdInput = document.getElementById('section_id');
        sectionIdInput.innerHTML = '<option value="">Select a section</option>';
        response.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.section_name;
            sectionIdInput.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading sections:', error);
        alert('Failed to load sections: ' + error.message);
    }
}

function showAddForm() {
    const overlay = document.getElementById('modalOverlay');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.style.opacity = '1', 10);
    loadSchools();
}

// Function to show school form modal
function showSchoolForm() {
    const overlay = document.getElementById('schoolModalOverlay');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.style.opacity = '1', 10);
}

// Function to close school form
function closeSchoolForm() {
    const overlay = document.getElementById('schoolModalOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Function to handle school form submission
async function handleSchoolSubmit(event) {
    event.preventDefault();

    const schoolData = {
        name: document.getElementById('school_name').value.trim(),
        address: document.getElementById('school_address').value.trim(),
        contact_number: document.getElementById('contact_number').value.trim()
    };

    try {
        await supabaseRequest('/rest/v1/schools', {
            method: 'POST',
            body: JSON.stringify(schoolData)
        });

        closeSchoolForm();
        loadSchools(); // Refresh the schools dropdown
        document.getElementById('schoolForm').reset();
    } catch (error) {
        console.error('Error adding school:', error);
        alert(`Failed to add school: ${error.message}`);
    }
}

function showSchoolForm() {
    const overlay = document.getElementById('schoolModalOverlay');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.style.opacity = '1', 10);
}

document.getElementById('addSchoolButton').addEventListener('click', showSchoolForm);
document.getElementById('closeSchoolButton').addEventListener('click', () => {
    const overlay = document.getElementById('schoolModalOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 300);
});

document.getElementById('schoolForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const schoolData = {
        name: document.getElementById('school_name').value,
        address: document.getElementById('school_address').value,
        contact_number: document.getElementById('contact_number').value
    };

    try {
        const response = await supabaseRequest('/rest/v1/schools', {
            method: 'POST',
            body: JSON.stringify(schoolData)
        });

        if (response.ok) {
            const overlay = document.getElementById('schoolModalOverlay');
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 300);
            document.getElementById('schoolForm').reset();
            loadSchools();
        } else {
            console.error('Error adding school:', await response.text());
        }
    } catch (error) {
        console.error('Error:', error);
    }
});


// Function to close add form modal
function closeAddForm() {
    const overlay = document.getElementById('modalOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Function to handle adding a new record
async function handleAddSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';

    const newStudent = {
        student_name: document.getElementById('name').value.trim(),
        roll_number: document.getElementById('roll_number').value.trim(),
        section_id: parseInt(document.getElementById('section_id').value) || null
    };

    try {
        await supabaseRequest('/rest/v1/students', {
            method: 'POST',
            body: JSON.stringify(newStudent)
        });

        form.reset(); // Reset the form fields
        closeAddForm();
        refreshData();
    } catch (error) {
        console.error('Error adding record:', error);
        alert(`Failed to add record: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
}

// Check authentication
function checkAuth() {
    if (!localStorage.getItem('isAuthenticated')) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    refreshData();

    // Attach event listeners
    document.getElementById('addButton').addEventListener('click', showAddForm);
    document.getElementById('refreshButton').addEventListener('click', refreshData);
    document.getElementById('closeButton').addEventListener('click', closeAddForm);
    document.getElementById('editCloseButton').addEventListener('click', closeEditForm);
    document.getElementById('studentForm').addEventListener('submit', handleAddSubmit);
    document.getElementById('schoolForm').addEventListener('submit', handleSchoolSubmit);
    document.getElementById('addSchoolButton').addEventListener('click', showSchoolForm);
    document.getElementById('closeSchoolButton').addEventListener('click', closeSchoolForm);
    
    // Add event listener for school selection
    document.getElementById('school_select').addEventListener('change', (e) => {
        const schoolId = e.target.value;
        if (schoolId) {
            loadSections(schoolId);
        }
    });
    
    // Add event listener for section filter
    document.getElementById('sectionFilter').addEventListener('input', refreshData);
});

// Make functions available globally
window.showAddForm = showAddForm;
window.refreshData = refreshData;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.showDetailPage = showDetailPage;

async function loadStudents() {
    try {
        const response = await supabaseRequest('/rest/v1/students?select=*,sections(section_name)');        
        const students = await response.json();
        const filteredStudents = filterStudents(students);
        const sortedStudents = sortStudents(filteredStudents);
        displayStudents(sortedStudents);
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function filterStudents(students) {
    const filterValue = document.getElementById('sectionFilter').value.trim();
    if (!filterValue) return students;
    return students.filter(student => student.section_id.toString() === filterValue);
}

function sortStudents(students) {
    const sortOption = document.getElementById('sortOption').value;
    if (!sortOption) return students;

    return [...students].sort((a, b) => {
        switch (sortOption) {
            case 'name_asc':
                return a.student_name.localeCompare(b.student_name);
            case 'name_desc':
                return b.student_name.localeCompare(a.student_name);
            case 'roll_asc':
                return (a.roll_number || '').localeCompare(b.roll_number || '');
            case 'roll_desc':
                return (b.roll_number || '').localeCompare(a.roll_number || '');
            default:
                return 0;
        }
    });
}

// Add event listeners for filtering and sorting
document.getElementById('sectionFilter').addEventListener('input', loadStudents);
document.getElementById('sortOption').addEventListener('change', loadStudents);