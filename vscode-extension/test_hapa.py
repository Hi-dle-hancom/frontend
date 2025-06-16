"""
HAPA 확장 프로그램 테스트용 Python 파일
이 파일은 HAPA의 다양한 기능을 테스트하기 위해 사용됩니다.
"""

def calculate_fibonacci(n):
    """
    피보나치 수열의 n번째 값을 계산하는 함수
    
    Args:
        n (int): 계산할 피보나치 수열의 위치 (0부터 시작)
    
    Returns:
        int: n번째 피보나치 수
    """
    if n < 0:
        raise ValueError("음수는 지원되지 않습니다")
    elif n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

def get_prime_numbers(limit):
    """
    주어진 한계값까지의 모든 소수를 찾는 함수
    
    Args:
        limit (int): 소수를 찾을 최대값
    
    Returns:
        list: 소수들의 리스트
    """
    primes = []
    for num in range(2, limit + 1):
        is_prime = True
        for i in range(2, int(num ** 0.5) + 1):
            if num % i == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(num)
    return primes

class Calculator:
    """
    간단한 계산기 클래스
    """
    
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        """두 수를 더합니다"""
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def multiply(self, a, b):
        """두 수를 곱합니다"""
        result = a * b
        self.history.append(f"{a} * {b} = {result}")
        return result
    
    def get_history(self):
        """계산 히스토리를 반환합니다"""
        return self.history

# 테스트 코드
if __name__ == "__main__":
    # 피보나치 테스트
    print("피보나치 수열 (0~10):")
    for i in range(11):
        print(f"F({i}) = {calculate_fibonacci(i)}")
    
    # 소수 테스트
    print("\n100 이하의 소수:")
    primes = get_prime_numbers(100)
    print(primes)
    
    # 계산기 테스트
    calc = Calculator()
    print(f"\n5 + 3 = {calc.add(5, 3)}")
    print(f"4 * 7 = {calc.multiply(4, 7)}")
    print("계산 히스토리:", calc.get_history()) 