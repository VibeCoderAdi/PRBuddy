import java.util.ArrayList;
import java.util.List;

public class BankAccount {

    public String ownerName;          // violation: should be private
    public double balance;            // violation: should be private
    public List<String> transactions; // violation: exposed mutable state

    public BankAccount(String ownerName, double balance) {
        this.ownerName = ownerName;
        this.balance = balance;
        this.transactions = new ArrayList<>();
    }

    public void deposit(double amount) {
        // violation: no input validation, no null/negative check
        balance += amount;
        transactions.add("Deposited: " + amount);
    }

    public void withdraw(double amount) {
        // violation: no check if amount > balance (boundary condition)
        balance -= amount;
        transactions.add("Withdrew: " + amount);
    }

    public List<String> getTransactions() {
        // violation: returning internal mutable list directly (no defensive copy)
        return transactions;
    }

    public void loadUserData(String username) {
        try {
            // simulating a DB call
            if (username == null) {
                throw new Exception("null user");
            }
        } catch (Exception e) {
            // violation: swallowed exception, silent failure
        }
    }

    public double divide(double a, double b) {
        // violation: no check for division by zero
        return a / b;
    }

    public static void main(String[] args) {
        BankAccount account = new BankAccount(null, 1000); // violation: null name accepted
        account.deposit(-500);   // violation: negative deposit allowed
        account.withdraw(9999);  // violation: overdraft allowed
        System.out.println("Balance: " + account.balance);
    }
}