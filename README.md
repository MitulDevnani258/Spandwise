# Spendwise — Expense Tracker

Spendwise is a lightweight, browser-based personal finance tracker. It lets you record income and expenses, review your spending, and keep a monthly budget. The interface and transaction values are displayed in Indian rupees (₹).

## Features

- **Login and sign-up:** Create a local account and switch between accounts on the same browser.
- **Income and expenses:** Add transactions with a title, amount, category, and date.
- **Dashboard totals:** View your balance, total income, total expenses, and spending for the current month.
- **Monthly budget:** Set a budget and see how much remains, along with a progress bar that changes color as you approach or exceed the limit.
- **Charts:** See expenses by category and compare income with expenses over the last six months.
- **Transaction tools:** Search by title, filter by type or expense category, and sort by date or amount.
- **Delete transactions:** Use the delete button or drag a transaction to the trash area.
- **CSV export:** Download the current account's transactions as a CSV file.
- **USD balance estimate:** The app requests the current INR-to-USD rate from the ExchangeRate-API and displays an approximate USD value for your balance when available.
- **Responsive layout:** The dashboard adapts to smaller screens.

## Run the app

No build step or package installation is required. Open `index.html` in a modern browser. For a more consistent browser experience, you can also serve the project directory with any static local web server and open its local URL.

## How to use

1. Choose **Sign Up**, enter a name, username, and password, then create an account. Or choose **Login** to use an existing account.
2. On the dashboard, select **Expense** or **Income**, complete the transaction fields, and choose **Add Expense** or **Add Income**.
3. Set a monthly budget in the budget card and select **Save**.
4. Use the search field, category/type chips, and sort menu to find transactions.
5. Select **Export CSV** to download transaction data, or select **Logout** to return to the login screen.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Defines the login form, dashboard, transaction controls, chart canvases, and page structure. |
| `style.css` | Provides the blue-themed styling, dashboard layout, and responsive rules. |
| `script.js` | Implements account handling, transaction and budget operations, charts, filtering, CSV export, and exchange-rate retrieval. |

## Data and privacy

This is a front-end demo and stores account data, transactions, budgets, and the current login state in the browser's `localStorage`. Data is specific to the browser and device; clearing browser storage removes it. It is not synchronized or backed up.

The password is hashed with SHA-256 where the browser's Web Crypto API is available, but this client-side approach is **not suitable for protecting real accounts or sensitive financial data**. There is no server-side authentication or encryption. The optional USD estimate also requires an internet connection and a third-party rate service; other app features work without that rate.
