import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, AlertCircle } from 'lucide-react';

export default function AdminCreatorSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: 'Aasim Muneer',
    bio: "Hi, I'm Aasim Muneer, a student and aspiring developer. I created this platform to help students easily access study materials, notes, PDFs, assignments, and educational resources in one place. My goal is to make learning simpler, faster, and accessible for everyone.",
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop',
    email: 'aasimmuneer349@gmail.com',
    github: '',
    linkedin: '',
    twitter: ''
  });

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      try {
        const docRef = doc(db, 'creatorInfo', 'profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm({ ...form, ...docSnap.data() });
        }
      } catch (err: any) {
        setError('Failed to load creator info: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCreatorInfo();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const docRef = doc(db, 'creatorInfo', 'profile');
      await setDoc(docRef, form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to save creator info: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white p-6">Loading setup...</div>;

  return (
    <div className="bg-surface p-6 rounded-xl border border-secondary shadow-lg mt-8">
      <h2 className="text-xl font-bold text-white mb-6">Creator Information</h2>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg flex items-center mb-6">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-500 p-4 rounded-lg flex items-center mb-6 font-bold">
          Saved successfully!
        </div>
      )}

      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-1">Profile Image URL</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Contact Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">GitHub URL</label>
            <input
              type="url"
              value={form.github}
              onChange={e => setForm({ ...form, github: e.target.value })}
              className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={form.linkedin}
              onChange={e => setForm({ ...form, linkedin: e.target.value })}
              className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Twitter URL</label>
            <input
              type="url"
              value={form.twitter}
              onChange={e => setForm({ ...form, twitter: e.target.value })}
              className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex items-center justify-center gap-2 w-full md:w-auto bg-primary text-secondary px-6 py-3 rounded-lg font-bold shadow-[0_4px_0_0_#0ea5e9] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Creator Info'}
        </button>
      </div>
    </div>
  );
}
