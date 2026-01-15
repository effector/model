# Requirements Document: User Management Demo

## 1. Overview

The User Management Demo showcases the polymorphism and dynamic behavior of the Effector Models API. It manages a list of heterogeneous user types (Guests and Members) with varying capabilities and visual representations.

## 2. User Entities & Roles

### 2.1. Guest

- **Definition**: A temporary user with minimal attributes.
- **Visuals**:
  - **Avatar**: 👋 (Waving hand). Size: 1.5rem.
  - **Style**: "Dull" appearance. **Name is grey** (`text-gray-600`). Low contrast to indicate limited status.
  - **Indicators**: No special icons.
- **Capabilities**:
  - **Kick**: Can be removed from the system.
  - **Promote**: **Button Removed**. Guests cannot be promoted.

### 2.2. Member (User)

- **Definition**: A registered user with a persistent profile.
- **Visuals**:
  - **Avatar**: 🙂 (Friendly smile). Size: 1.5rem.
  - **Style**: "Cool" and standard. Indigo/blue accents, clear text.
  - **Indicators**: No special icons.
- **Capabilities**:
  - **Promote**: Can be upgraded to the "Admin" role.
  - **Kick**: Can be removed from the system.

### 2.3. Member (Admin)

- **Definition**: A privileged user with administrative rights.
- **Visuals**:
  - **Avatar**: 😎 (Cool with sunglasses). Size: 1.5rem.
  - **Style**: Prominent and bold. Enhanced highlighting (e.g., indigo/purple border or background).
- **Capabilities**:
  - **Demote**: Can be downgraded to the "User" role.
  - **Immunity**: **Cannot be kicked**. The system must prevent removal of administrators at both the UI and Logic levels.

## 3. Functional Requirements

### 3.1. User List Management

- **Polymorphic Storage**: The system must support a single list (`usersList`) containing both `guest` and `member` model instances.
- **Addition**: Users can be added as "Guest", "Member (User)", or "Member (Admin)".

### 3.2. Role Transitions (The "Promote" Feature)

- **Action**: A contextual button that changes based on the current role.
- **Member (User) -> Member (Admin)**:
  - Triggered by the "Promote" (↑) button.
  - Updates the user's role and refreshes visuals (adds star icon).
- **Member (Admin) -> Member (User)**:
  - Triggered by the "Demote" (↓) button.
  - Updates the user's role and refreshes visuals (removes star icon).
- **Guests**: This feature is completely unavailable for Guest users.

### 3.3. Removal (The "Kick" Feature)

- **Requirement**: The system uses a "Kick" metaphor for removal. The generic "Delete" (🗑️) button is strictly forbidden.
- **Availability**:
  - **Guests**: "Kick" (×) button is visible and functional.
  - **Member (User)**: "Kick" (×) button is visible and functional.
  - **Member (Admin)**: "Kick" (×) button is **hidden**.
- **Security**: The logic layer must verify the user's role before processing a removal request. If a "Kick" event is received for an Admin, it must be ignored.

## 4. UI/UX Specifications

### 4.1. User Item Component

- **Selection**: Clicking a user item selects it, displaying detailed information in the side panel.
- **Hover State**: Action buttons (Promote/Demote/Kick) should appear or gain opacity on hover.
- **Layout**:
  - Left: Name and ID.
  - Right: Contextual action buttons.

### 4.2. Detailed View

- Displays the selected user's ID, Name, and Role.
- Role must update reactively when a user is promoted or demoted.

## 5. Technical Architecture (Effector Models)

### 5.1. Model Structure

- **`guestModel`**: Includes `chatUserFacet`.
- **`memberModel`**: Includes `chatUserFacet` and `memberFacet`.
- **`userUnion`**: A union of the two models above.

### 5.2. Logic Implementation

- **`match()`**: Used in the controller logic to route the `toggleRole` action only to model instances that support the `membership` facet.
- **`select()`**: Used in the view layer to reactively extract `$role` and `$nickname` from the polymorphic model instances.
- **Guard Samples**: Use Effector `sample` with `filter` to implement the Admin immunity logic.
