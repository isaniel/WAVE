import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { registerUser } from '@/services/firebase';
import type { UserRole } from '@/types';
import seedData from '@/data/data.json';

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Business Administration',
  'Economics',
  'Law',
  'Medicine',
  'Pharmacy',
];

type SeedStudent = {
  name: string;
  email: string;
  matricNumber: string;
};

type SeedStaff = {
  name: string;
  email: string;
  staffId: string;
  role?: string;
};

type SeedData = {
  students: SeedStudent[];
  staff: SeedStaff[];
};

const typedSeedData = seedData as SeedData;

const normalize = (value: string) => value.trim().toLowerCase();

const getSeedRole = (role: UserRole, record: SeedStudent | SeedStaff): UserRole => {
  if (role === 'student') {
    return 'student';
  }

  const normalizedSeedRole = normalize((record as SeedStaff).role ?? '');

  if (normalizedSeedRole === 'admin') {
    return 'admin';
  }

  return 'lecturer';
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedFullName = normalize(fullName);
    const normalizedEmail = normalize(email);
    const normalizedIdentifier = normalize(identifier);

    const matchedRecord =
      role === 'student'
        ? typedSeedData.students.find(
            (student) =>
              normalize(student.name) === normalizedFullName &&
              normalize(student.email) === normalizedEmail &&
              normalize(student.matricNumber) === normalizedIdentifier
          )
        : typedSeedData.staff.find(
            (staffMember) =>
              normalize(staffMember.name) === normalizedFullName &&
              normalize(staffMember.email) === normalizedEmail &&
              normalize(staffMember.staffId) === normalizedIdentifier
          );

    if (!matchedRecord) {
      setError('The details do not match any record in the data file.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const resolvedRole = getSeedRole(role, matchedRecord);

    setLoading(true);

    try {
      await registerUser({
        fullName,
        email,
        password,
        role: resolvedRole,
        department,
        matricNumber: role === 'student' ? (matchedRecord as SeedStudent).matricNumber : undefined,
        staffId: role === 'student' ? undefined : (matchedRecord as SeedStaff).staffId,
      });

      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Wave</h1>
              <p className="text-slate-400 text-sm">Engine</p>
            </div>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Create Account</CardTitle>
            <CardDescription className="text-slate-400">
              Join your campus community today
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="lecturer">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-slate-300">
                  {role === 'student' ? 'Matric Number' : 'Staff ID'}
                </Label>
                <Input
                  id="identifier"
                  placeholder={role === 'student' ? 'DU0200' : 'DUS100'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-slate-300">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 max-h-48">
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-sm text-slate-400 text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-8">
          Wave Engine - University Communication Platform
        </p>
      </div>
    </div>
  );
};

export default Register;
