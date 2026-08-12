import { useMemo } from 'react';
import { FiArrowRight, FiCheck, FiChevronRight, FiUser } from 'react-icons/fi';
import { PiRuler } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';

import homeManImage from '@/assets/images/Homepageman.png';
import homeWomenImage from '@/assets/images/homepagewomen.png';
import nextStepImage from '@/assets/images/homeapage-nexttape.png';
import { useAuth } from '@/context/auth-context';
import { useProfileSubject } from '@/context/profile-subject-context';
import {
  CLOTHING_OPTIONS_BY_GENDER,
  getClothingTemplate,
  normalizeGender,
  type ClothingChoice,
} from '@/lib/measurement';
import { resolveBrandDisplay } from '@/lib/recommendation-view';
import { useRecommendationData } from '@/lib/use-recommendation-data';

const CSS = `
  .dh-root { min-height:100dvh; background:#fafaf8; color:#0d0d0d; font-family:var(--font-sans,'DM Sans',sans-serif); }
  .dh-page { width:min(960px,100%); margin:0 auto; padding:30px 32px 124px; }
  .dh-greeting { min-height:198px; display:grid; grid-template-columns:minmax(0,1fr) minmax(280px,42%); align-items:center; gap:18px; padding:0 0 14px; overflow:hidden; }
  .dh-greeting-copy { position:relative; z-index:1; }
  .dh-greeting-figure { position:relative; align-self:stretch; min-height:184px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#eef5eb; border-radius:8px; }
  .dh-greeting-figure::after { content:''; position:absolute; left:12%; right:12%; bottom:8px; height:18px; border-radius:50%; background:rgba(73,102,87,.12); filter:blur(10px); }
  .dh-greeting-figure img { position:relative; z-index:1; width:100%; height:100%; display:block; object-fit:cover; object-position:center 38%; }
  .dh-greeting h1 { max-width:520px; margin:0; font-family:var(--font-display,'Cormorant Garamond',serif); font-size:clamp(34px,3.4vw,42px); line-height:1.04; letter-spacing:0; }
  .dh-greeting-sub { margin:7px 0 0; color:#777975; font-size:13px; }
  .dh-section { padding:21px 0; border-bottom:1px solid #e8e8e3; }
  .dh-section-head { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:15px; }
  .dh-section-head h2 { margin:0; font-size:15px; letter-spacing:0; }
  .dh-section-head span { color:#858783; font-size:11px; }
  .dh-profiles { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; }
  .dh-profiles::-webkit-scrollbar { display:none; }
  .dh-profile { min-width:max-content; display:flex; align-items:center; gap:7px; min-height:38px; padding:4px 11px 4px 5px; border:1px solid #dedfd9; border-radius:999px; background:#fff; color:#666963; font:600 11px inherit; cursor:pointer; }
  .dh-profile.active { border-color:#111; background:#111; color:#fff; }
  .dh-profile-avatar { width:28px; height:28px; display:grid; place-items:center; border-radius:50%; background:#f0f1ed; color:#111; font-size:10px; font-weight:800; }
  .dh-profile.active .dh-profile-avatar { background:rgba(255,255,255,.14); color:#fff; }
  .dh-profile-add { color:#496657; border-style:dashed; border-color:#9db39f; background:#f2f7f0; }
  .dh-profile-add .dh-profile-avatar { background:#dcebd9; color:#496657; font-size:16px; }
  .dh-summary { padding:14px 0 20px; border-bottom:1px solid #e8e8e3; }
  .dh-summary-row { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:8px; font-size:11px; color:#777a75; }
  .dh-summary-row strong { color:#111; font-size:12px; }
  .dh-progress { height:5px; overflow:hidden; border-radius:999px; background:#e8ece8; }
  .dh-progress span { display:block; height:100%; border-radius:inherit; background:#496657; transition:width .5s ease; }
  .dh-action { position:relative; overflow:hidden; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:14px; min-height:142px; padding:20px 132px 20px 20px; border:1px solid #c8dac5; border-radius:8px; background:#eef5eb; }
  .dh-action-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:8px; background:#fff; color:#668469; font-size:20px; }
  .dh-action strong,.dh-action span { display:block; }
  .dh-action strong { max-width:380px; font-family:var(--font-display,'Cormorant Garamond',serif); font-size:21px; line-height:1.15; }
  .dh-action span { margin-top:3px; color:#6d756b; font-size:11px; }
  .dh-action button,.dh-view-all { min-height:40px; border:0; border-radius:8px; background:#111; color:#fff; padding:0 16px; font:700 11px inherit; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:7px; }
  .dh-action-art { position:absolute; inset:0 0 0 auto; width:48%; height:100%; object-fit:cover; object-position:70% center; opacity:.42; pointer-events:none; mix-blend-mode:multiply; }
  .dh-action::after { content:''; position:absolute; inset:0; pointer-events:none; background:linear-gradient(90deg,#eef5eb 0%,#eef5eb 54%,rgba(238,245,235,.72) 72%,rgba(238,245,235,.12) 100%); }
  .dh-action>*:not(.dh-action-art) { position:relative; z-index:1; }
  .dh-coverage-summary { margin-bottom:14px; }
  .dh-coverage-summary-row { display:flex; justify-content:space-between; gap:12px; margin-bottom:7px; font-size:11px; color:#777a75; }
  .dh-coverage-summary-row strong { color:#496657; }
  .dh-coverage { border-top:1px solid #e8e8e3; }
  .dh-coverage-row { width:100%; min-height:52px; display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:10px; padding:8px 10px; border:0; border-bottom:1px solid #e8e8e3; background:transparent; text-align:left; cursor:pointer; }
  .dh-coverage-row.complete { background:#f2f7f0; }
  .dh-coverage-row.not-added { color:#7f817d; }
  .dh-coverage-name { display:flex; align-items:center; gap:11px; min-width:0; font-size:13px; font-weight:700; }
  .dh-coverage-icon { width:30px; height:30px; display:grid; place-items:center; flex:0 0 auto; border-radius:7px; background:#f0f1ed; color:#496657; }
  .dh-coverage-row.complete .dh-coverage-icon { background:#dcebd9; }
  .dh-coverage-state { color:#777a75; font-size:11px; white-space:nowrap; }
  .dh-coverage-state.complete { color:#55775a; font-weight:700; }
  .dh-coverage-row>svg { color:#a0a29e; }
  .dh-recommendations { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
  .dh-rec { overflow:hidden; display:flex; flex-direction:column; min-width:0; border:1px solid #e2e3de; border-radius:14px; background:#fff; cursor:pointer; text-align:left; padding:0; transition:transform .2s,box-shadow .2s; }
  .dh-rec:hover { transform:translateY(-3px); box-shadow:0 14px 38px rgba(0,0,0,.08); }
  .dh-rec.perfect { border-color:rgba(122,158,120,.5); box-shadow:0 0 0 1px rgba(122,158,120,.13),0 8px 24px rgba(122,158,120,.1); }
  .dh-rec-image { position:relative; width:100%; aspect-ratio:4/3; background:#f0f1ed; display:grid; place-items:center; overflow:hidden; }
  .dh-rec-image img { width:100%; height:100%; object-fit:contain; padding:10px; }
  .dh-rec-placeholder { color:#9a9d98; font-size:24px; }
  .dh-rec-score { position:absolute; top:9px; right:9px; padding:4px 9px; border-radius:999px; background:#111; color:#fff; font-size:10px; font-weight:800; }
  .dh-rec-body { display:flex; flex:1; flex-direction:column; min-height:150px; padding:14px 15px 15px; min-width:0; }
  .dh-rec-title { font-size:14px; font-weight:700; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dh-rec-category { margin-top:3px; color:#777a75; font-size:10px; }
  .dh-rec-result { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; padding-top:10px; border-top:1px solid #e8e8e3; }
  .dh-rec-size-wrap { display:flex; align-items:baseline; gap:5px; }
  .dh-rec-size { font-family:var(--font-display,'Cormorant Garamond',serif); color:#111; font-size:27px; font-weight:700; line-height:1; }
  .dh-rec-size-label { color:#777a75; font-size:10px; }
  .dh-rec-fit { padding:4px 8px; border-radius:999px; background:#efefec; color:#496657; font-size:9px; font-weight:800; white-space:nowrap; }
  .dh-rec-link { align-self:flex-start; min-height:28px; display:inline-flex; align-items:center; gap:5px; margin-top:9px; padding:0 10px; border-radius:999px; background:#111; color:#fff; font-size:9px; font-weight:800; }
  .dh-empty { padding:26px 0; color:#777a75; font-size:12px; }
  .dh-section-footer { display:flex; justify-content:flex-end; margin-top:16px; }
  @media(max-width:700px) {
    .dh-page { padding:20px 18px 118px; }
    .dh-greeting { min-height:154px; grid-template-columns:minmax(0,1fr) minmax(142px,42%); gap:8px; padding:0 0 12px; }
    .dh-greeting-figure { min-height:146px; }
    .dh-greeting-figure img { object-position:center 34%; }
    .dh-greeting h1 { font-size:clamp(28px,8vw,32px); }
    .dh-greeting-sub { max-width:190px; font-size:12px; line-height:1.45; }
    .dh-action { grid-template-columns:auto minmax(0,1fr); min-height:158px; padding:18px 100px 18px 16px; }
    .dh-action button { grid-column:1/-1; width:100%; }
    .dh-action-art { width:52%; opacity:.38; }
    .dh-action::after { background:linear-gradient(90deg,#eef5eb 0%,#eef5eb 58%,rgba(238,245,235,.7) 76%,rgba(238,245,235,.14) 100%); }
    .dh-recommendations { grid-template-columns:1fr; }
    .dh-rec { min-height:108px; display:grid; grid-template-columns:90px minmax(0,1fr); border-radius:12px; }
    .dh-rec:hover { transform:none; box-shadow:none; }
    .dh-rec-image { height:100%; min-height:108px; aspect-ratio:auto; border-right:1px solid #e8e8e3; }
    .dh-rec-image img { padding:7px; }
    .dh-rec-score { top:auto; right:5px; bottom:5px; padding:3px 7px; font-size:9px; }
    .dh-rec-body { min-height:0; padding:9px 10px; }
    .dh-rec-title { font-size:12px; }
    .dh-rec-result { margin-top:6px; padding-top:6px; }
    .dh-rec-size { font-size:22px; }
    .dh-rec-fit { padding:3px 7px; font-size:8.5px; }
    .dh-rec-link { min-height:25px; margin-top:6px; padding:0 8px; font-size:9px; }
    .dh-section-head span { display:none; }
  }
  @media(max-width:370px) {
    .dh-page { padding-left:14px; padding-right:14px; }
    .dh-coverage-state { max-width:128px; white-space:normal; text-align:right; }
  }
`;

function hasMeasurement(value: unknown) {
  const number = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(number) && number > 0;
}

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function EmptyHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSubject, subjectOptions, setSelectedSubjectKey } = useProfileSubject();
  const { profile, sellers, sections, categoryOptions, measurementProfiles, normalizedGender, loading } = useRecommendationData(user?.uid);

  const rawFirstName = (selectedSubject?.label || profile?.firstName || user?.displayName || 'there').split(' ')[0];
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);
  const gender = normalizeGender(normalizedGender) ?? normalizeGender(profile?.gender) ?? 'men';
  const options = categoryOptions.length ? categoryOptions : CLOTHING_OPTIONS_BY_GENDER[gender];

  const coverage = useMemo(() => options.map(option => {
    const saved = measurementProfiles.find(entry => entry.preferredClothing === option.key) ?? null;
    const template = getClothingTemplate(normalizeGender(saved?.gender) ?? gender, option.key);
    const fields = template?.fields ?? [];
    const missing = fields.filter(field => !hasMeasurement(saved?.measurements?.[field.key]));
    const addedCount = fields.filter(field => hasMeasurement(saved?.measurements?.[field.key])).length;
    return { option, saved, missing, fieldCount: fields.length, addedCount, complete: !!saved && missing.length === 0 };
  }), [gender, measurementProfiles, options]);

  const measurementProgress = useMemo(() => {
    const total = coverage.reduce((sum, item) => sum + item.fieldCount, 0);
    const added = coverage.reduce((sum, item) => sum + item.addedCount, 0);
    return { total, added, percent: total ? Math.round((added / total) * 100) : 0 };
  }, [coverage]);

  const nextAction = useMemo(() => {
    const addedWithMissing = coverage.filter(item => item.saved && item.missing.length);
    const trouser = addedWithMissing.find(item => item.option.key === 'trouser');
    const target = trouser ?? addedWithMissing[0] ?? coverage.find(item => !item.saved) ?? null;
    if (!target) return null;
    const field = target.missing.find(item => item.key === 'inseam') ?? target.missing[0];
    const path = target.saved
      ? `/app/add-preference?profileKey=${target.saved.profileKey}`
      : `/app/add-preference?choice=${target.option.key}`;
    return {
      path,
      title: field ? `Add ${field.label.toLowerCase()} for more accurate ${target.option.label.toLowerCase()} sizes` : `Add ${target.option.label.toLowerCase()} measurements`,
      label: field ? `Add ${field.label.replace(/ length$/i, '')}` : `Add ${target.option.label}`,
      detail: field ? 'One quick measurement can improve your recommendations.' : 'Complete this category to unlock size recommendations.',
    };
  }, [coverage]);

  const recent = useMemo(() => sections
    .flatMap(section => section.recommendations.map(card => ({
      ...card,
      sectionLabel: section.label,
      seller: card.sellerUserId ? sellers[card.sellerUserId] ?? null : null,
    })))
    .filter(card => card.availability === 'recommended')
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 3), [sections, sellers]);

  return (
    <main className="dh-root">
      <style>{CSS}</style>
      <div className="dh-page">
        <header className="dh-greeting">
          <div className="dh-greeting-copy">
            <h1>{greetingForHour(new Date().getHours())}, {firstName}.</h1>
            <p className="dh-greeting-sub">Let’s find your best fit today.</p>
          </div>
          <div className="dh-greeting-figure" aria-hidden="true">
            <img src={gender === 'women' ? homeWomenImage : homeManImage} alt="" />
          </div>
        </header>

        <section className="dh-section" aria-labelledby="dh-profile-title">
          <div className="dh-section-head"><h2 id="dh-profile-title">Shopping for</h2><span>Switch profile</span></div>
          <div className="dh-profiles">
            {subjectOptions.map(option => {
              const initials = option.label.split(' ').map(word => word[0]).slice(0,2).join('').toUpperCase();
              return <button key={option.key} className={`dh-profile${selectedSubject?.key === option.key ? ' active' : ''}`} onClick={() => setSelectedSubjectKey(option.key)}><span className="dh-profile-avatar">{initials || <FiUser />}</span>{option.label}</button>;
            })}
            <button className="dh-profile dh-profile-add" onClick={() => navigate('/app/profile')}><span className="dh-profile-avatar">+</span>Add</button>
          </div>
        </section>

        <div className="dh-summary" aria-label={`Fit profile ${measurementProgress.percent}% complete`}>
          <div className="dh-summary-row"><strong>Your fit profile</strong><span>{measurementProgress.percent}% complete</span></div>
          <div className="dh-progress"><span style={{ width: `${measurementProgress.percent}%` }} /></div>
        </div>

        {nextAction && <section className="dh-section" aria-labelledby="dh-action-title">
          <div className="dh-section-head"><h2 id="dh-action-title">Next step</h2></div>
          <div className="dh-action">
            <span className="dh-action-icon"><PiRuler /></span>
            <div><strong>{nextAction.title}</strong><span>{nextAction.detail}</span></div>
            <button onClick={() => navigate(nextAction.path)}>{nextAction.label}<FiArrowRight /></button>
            <img className="dh-action-art" src={nextStepImage} alt="" aria-hidden="true" />
          </div>
        </section>}

        <section className="dh-section" aria-labelledby="dh-coverage-title">
          <div className="dh-section-head"><h2 id="dh-coverage-title">Measurement coverage</h2><span>Tap a category to update it</span></div>
          <div className="dh-coverage-summary">
            <div className="dh-coverage-summary-row"><strong>{measurementProgress.added} of {measurementProgress.total} measurements added</strong><span>{measurementProgress.percent}%</span></div>
            <div className="dh-progress"><span style={{ width: `${measurementProgress.percent}%` }} /></div>
          </div>
          <div className="dh-coverage">
            {coverage.map(({ option, saved, missing, complete }) => (
              <button key={option.key} className={`dh-coverage-row${complete ? ' complete' : !saved ? ' not-added' : ''}`} onClick={() => navigate(saved ? `/app/add-preference?profileKey=${saved.profileKey}` : `/app/add-preference?choice=${option.key}`)}>
                <span className="dh-coverage-name"><span className="dh-coverage-icon">{complete ? <FiCheck /> : <PiRuler />}</span>{option.label}</span>
                <span className={`dh-coverage-state${complete ? ' complete' : ''}`}>{!saved ? 'Not added' : complete ? 'Complete' : `${missing.length} measurement${missing.length === 1 ? '' : 's'} missing`}</span>
                <FiChevronRight />
              </button>
            ))}
          </div>
        </section>

        <section className="dh-section" aria-labelledby="dh-recent-title">
          <div className="dh-section-head"><h2 id="dh-recent-title">Recent recommendations</h2><span>Your strongest matches</span></div>
          {loading ? <div className="dh-empty">Loading your recommendations…</div> : recent.length ? <div className="dh-recommendations">
            {recent.map(card => {
              const brand = resolveBrandDisplay(card.brand, card.seller);
              const image = card.imageUrl || card.seller?.photoURL || null;
              const fit = card.matchScore >= 75 && card.confidence === 'high' ? 'Perfect fit' : 'Great fit';
              const title = card.title.toLowerCase().startsWith(brand.toLowerCase()) ? card.title : `${brand} ${card.title}`;
              return <button key={`${card.id}-${card.sectionLabel}`} className={`dh-rec${fit === 'Perfect fit' ? ' perfect' : ''}`} onClick={() => navigate('/app/explore')}>
                <span className="dh-rec-image">{image ? <img src={image} alt={title} /> : <span className="dh-rec-placeholder"><PiRuler /></span>}<span className="dh-rec-score">{Math.round(card.matchScore)}%</span></span>
                <span className="dh-rec-body">
                  <span className="dh-rec-title">{title}</span>
                  <span className="dh-rec-category">{card.sectionLabel}</span>
                  <span className="dh-rec-result"><span className="dh-rec-size-wrap"><span className="dh-rec-size">{card.sizeLabel || card.recommendedSize || '—'}</span><span className="dh-rec-size-label">size</span></span><span className="dh-rec-fit">{fit}</span></span>
                  <span className="dh-rec-link">View fit details</span>
                </span>
              </button>;
            })}
          </div> : <div className="dh-empty">Add measurements to start receiving recommendations.</div>}
          <div className="dh-section-footer"><button className="dh-view-all" onClick={() => navigate('/app/explore')}>View all in Explore <FiArrowRight /></button></div>
        </section>
      </div>
    </main>
  );
}

export default EmptyHomePage;
