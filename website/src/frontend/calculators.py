
def dt_calculator(monthly_debt: float, monthly_income: float) -> float:
    """
    Calculates the Debt-to-Income (DTI) ratio.
    """
    if monthly_income == 0:
        return 0.0
    return (monthly_debt / monthly_income) * 100

def ltv_calculator(loan_amount: float, property_value: float) -> float:
    """
    Calculates the Loan-to-Value (LTV) ratio.
    """
    if property_value == 0:
        return 0.0
    return (loan_amount / property_value) * 100
