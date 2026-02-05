#!/usr/bin/env python3
"""
Test Compliance Checker Lambda Function
"""
import sys
import os
sys.path.insert(0, 'lambda-functions/ComplianceCheckerLambda')

from lambda_function import check_text_compliance, lambda_handler
import json

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_visa_content():
    """Test visa content detection"""
    print_header("Testing Visa Content Detection")
    
    test_cases = [
        ("Looking for H1B candidates only", False, "Should detect H1B"),
        ("OPT preferred for this role", False, "Should detect OPT"),
        ("No CPT candidates please", False, "Should detect CPT"),
        ("Must have GC or citizenship", False, "Should detect GC/citizenship"),
        ("Visa sponsorship available", False, "Should detect visa sponsorship"),
        ("Experienced Python developer needed", True, "Should pass - no visa content"),
        ("Looking for talented engineers", True, "Should pass - compliant")
    ]
    
    passed = 0
    failed = 0
    
    for text, should_pass, description in test_cases:
        is_compliant, violations = check_text_compliance(text)
        
        if is_compliant == should_pass:
            print(f"✅ PASS: {description}")
            print(f"   Text: \"{text}\"")
            passed += 1
        else:
            print(f"❌ FAIL: {description}")
            print(f"   Text: \"{text}\"")
            print(f"   Expected: {'compliant' if should_pass else 'non-compliant'}")
            print(f"   Got: {'compliant' if is_compliant else 'non-compliant'}")
            if violations:
                print(f"   Violations: {[v['type'] for v in violations]}")
            failed += 1
    
    print(f"\n📊 Results: {passed} passed, {failed} failed")
    return failed == 0

def test_bench_content():
    """Test bench sales detection"""
    print_header("Testing Bench Sales Detection")
    
    test_cases = [
        ("Bench sales position available", False, "Should detect bench sales"),
        ("Bench recruiting opportunity", False, "Should detect bench recruiting"),
        ("Available candidate details below", False, "Should detect bench list"),
        ("Recruiting manager needed", True, "Should pass - normal recruiting"),
        ("Sales engineer position", True, "Should pass - normal sales")
    ]
    
    passed = 0
    failed = 0
    
    for text, should_pass, description in test_cases:
        is_compliant, violations = check_text_compliance(text)
        
        if is_compliant == should_pass:
            print(f"✅ PASS: {description}")
            passed += 1
        else:
            print(f"❌ FAIL: {description}")
            print(f"   Text: \"{text}\"")
            failed += 1
    
    print(f"\n📊 Results: {passed} passed, {failed} failed")
    return failed == 0

def test_full_lambda():
    """Test the full Lambda handler"""
    print_header("Testing Full Lambda Handler")
    
    # Test compliant email
    event1 = {
        'body': json.dumps({
            'subject': 'Software Engineer Position',
            'body': 'We are looking for an experienced Python developer with 5+ years of experience.',
            'useAI': False
        })
    }
    
    response1 = lambda_handler(event1, None)
    result1 = json.loads(response1['body'])
    
    print("\n✅ Test 1: Compliant Email")
    print(f"   Is Compliant: {result1['isCompliant']}")
    print(f"   Violations: {result1['summary']['total']}")
    
    # Test non-compliant email
    event2 = {
        'body': json.dumps({
            'subject': 'H1B Candidates Only',
            'body': 'Looking for bench sales recruiters. OPT preferred. No CPT.',
            'useAI': False
        })
    }
    
    response2 = lambda_handler(event2, None)
    result2 = json.loads(response2['body'])
    
    print("\n❌ Test 2: Non-Compliant Email")
    print(f"   Is Compliant: {result2['isCompliant']}")
    print(f"   Violations: {result2['summary']['total']}")
    print(f"   Critical: {result2['summary']['critical']}")
    print(f"   High: {result2['summary']['high']}")
    
    if result2['violations']:
        print("\n   Detected Violations:")
        for v in result2['violations'][:3]:  # Show first 3
            print(f"   - {v['type']}: \"{v['text']}\" ({v['severity']})")
    
    if result2['suggestions']:
        print("\n   Suggestions:")
        for s in result2['suggestions']:
            print(f"   {s}")
    
    return result1['isCompliant'] and not result2['isCompliant']

def main():
    print("\n" + "=" * 70)
    print("🧪 Compliance Checker Lambda - Test Suite")
    print("=" * 70)
    
    all_passed = True
    
    # Run tests
    all_passed &= test_visa_content()
    all_passed &= test_bench_content()
    all_passed &= test_full_lambda()
    
    # Final results
    print("\n" + "=" * 70)
    if all_passed:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 70)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
