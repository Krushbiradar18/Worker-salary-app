# Excel Template Format for Bulk Worker Import

To bulk import workers, create an Excel file (.xlsx) with the following columns:

## Required Columns:
- **Name**: Worker's full name
- **Phone**: Phone number

## Optional Columns:
- **Rate**: Daily rate (default: 500 if not provided)
- **Role**: Worker role (default: "Worker" if not provided)
  - Options: Worker, Mason, Helper, Supervisor

## Example:
```
| Name          | Phone        | Rate | Role       |
|---------------|--------------|------|------------|
| John Doe      | 9876543210   | 600  | Mason      |
| Jane Smith    | 8765432109   | 500  | Worker     |
| Mike Johnson  | 7654321098   | 700  | Supervisor |
```

## Steps to Import:
1. Select a site first
2. Click "Choose File" and select your Excel file
3. Review the preview data and edit rates/roles if needed
4. Click "Import All" to add all workers to the selected site

## Notes:
- The system will automatically create attendance records for imported workers
- Make sure the Excel file has headers in the first row
- Empty rows will be skipped
- If Name or Phone is missing, that row will be ignored
- All workers will be assigned to the currently selected site