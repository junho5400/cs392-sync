import { useState, type FormEvent } from 'react';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Input } from './ui/Input';
import { SectionTitle } from './ui/SectionTitle';
import { Segmented } from './ui/Segmented';
import type { JoinInput } from '../services/meet';

interface Props {
  onJoin: (input: JoinInput) => Promise<void>;
}

export const JoinForm = ({ onJoin }: Props) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [optional, setOptional] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await onJoin({ name, password, optional });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <SectionTitle>Add your times</SectionTitle>
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="off" />
      </Field>
      <Field label="Password" aside="Optional">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="To edit from another device"
          autoComplete="new-password"
        />
      </Field>
      <Field
        group
        label="Attendance"
        hint={
          error ? (
            <span role="alert" className="block truncate text-red-600 dark:text-red-400" title={error}>
              {error}
            </span>
          ) : optional ? (
            'Best times can leave you out'
          ) : (
            'Best times must include you'
          )
        }
      >
        <Segmented
          label="Attendance"
          value={optional ? 'optional' : 'required'}
          options={[
            { value: 'required', label: 'Required' },
            { value: 'optional', label: 'Optional' },
          ]}
          onChange={(v) => setOptional(v === 'optional')}
        />
      </Field>
      <Button type="submit" variant="primary" size="md" disabled={!name.trim() || busy}>
        Join
      </Button>
    </form>
  );
};
