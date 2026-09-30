import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchVideos } from '../../services/videosService';
import { fetchAudios } from '../../services/audiosService';
import {
  fetchActiveMembershipPlans,
  subscribeToMembershipPlans,
  formatMembershipPlanPrice,
  formatPriceValue
} from '../../services/membershipPlansService';
import {
  fetchActiveUserMembership,
  subscribeToUserMemberships,
  formatMembershipDate
} from '../../services/membershipsService';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import { CheckoutModal } from '../../components/Checkout/CheckoutModal';
import { supabase } from '../../lib/supabase';
import { useAccessControl } from '../../context/AccessControlContext';
import './VipPass.css';

export const VipPass = ({ onNavigateToSpark, onNavigateToVideo, onNavigateToAudio }) => {
  const { user, profile, isAuthenticated, isVip, openAuth, refreshProfile } = useAuth();
  const { requireAccess } = useAccessControl();

  const [activeVipVideo, setActiveVipVideo] = useState(null);
  const [vipContent, setVipContent] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);

  // Dynamic membership plans state from Supabase (single source of truth)
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState(null);

  // User active membership state from Supabase
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

  // Selected membership plan and checkout state
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutReceipt, setCheckoutReceipt] = useState(null);

  // Derived selected plan object from dynamic membership plans
  const selectedPlan = membershipPlans.find((p) => p.id === selectedPlanId) || null;

  // VIP status dynamically derived strictly from Supabase source of truth
  // User is VIP only if authenticated AND profile.is_vip is true AND membership is active
  const userHasVip = Boolean(
    isAuthenticated &&
    profile?.is_vip === true &&
    membershipInfo?.hasActiveMembership === true &&
    membershipInfo?.isVip === true
  );

  const activePlan = userHasVip ? membershipInfo?.plan || null : null;

  // Load active user membership dynamically from Supabase
  const loadUserMembership = useCallback(async () => {
    if (!user?.id) {
      setMembershipInfo(null);
      setLoadingMembership(false);
      return;
    }
    try {
      setLoadingMembership(true);
      const [latestProfile, info] = await Promise.all([
        refreshProfile?.(),
        fetchActiveUserMembership(user.id)
      ]);

      if (latestProfile && !latestProfile.is_vip) {
        setMembershipInfo({
          hasActiveMembership: false,
          isVip: false,
          membership: null,
          plan: null,
          startDate: null,
          endDate: null,
          status: 'revoked'
        });
      } else {
        setMembershipInfo(info);
      }
    } catch (err) {
      console.warn('[VipPass] Error loading active user membership:', err);
      setMembershipInfo(null);
    } finally {
      setLoadingMembership(false);
    }
  }, [user?.id, refreshProfile]);

  // Load active membership plans dynamically from Supabase
  const loadDynamicMembershipPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      setPlansError(null);
      const plans = await fetchActiveMembershipPlans();
      setMembershipPlans(plans);
    } catch (err) {
      console.warn('[VipPass] Error loading dynamic membership plans:', err);
      setPlansError('Unable to load current membership plans.');
      setMembershipPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  // Initial load and whenever profile.is_vip changes (e.g. from Realtime)
  useEffect(() => {
    loadUserMembership();
  }, [profile?.is_vip, loadUserMembership]);

  // Subscribe to Realtime membership and profile updates
  useEffect(() => {
    if (user?.id) {
      const sub = subscribeToUserMemberships(user.id, async () => {
        await refreshProfile?.();
        loadUserMembership();
      });
      return () => {
        sub?.unsubscribe();
      };
    }
  }, [user?.id, loadUserMembership, refreshProfile]);

  // Initial load of plans and subscribe to realtime plan updates
  useEffect(() => {
    loadDynamicMembershipPlans();

    // Subscribe to realtime changes in public.membership_plans so Admin Dashboard changes reflect immediately
    const subscription = subscribeToMembershipPlans(() => {
      loadDynamicMembershipPlans();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadDynamicMembershipPlans]);

  // Handle app resume / window focus / tab visibility change
  useEffect(() => {
    const handleAppResume = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        loadUserMembership();
        loadDynamicMembershipPlans();
      }
    };

    window.addEventListener('focus', handleAppResume);
    document.addEventListener('visibilitychange', handleAppResume);

    return () => {
      window.removeEventListener('focus', handleAppResume);
      document.removeEventListener('visibilitychange', handleAppResume);
    };
  }, [user?.id, loadUserMembership, loadDynamicMembershipPlans]);

  // Load all VIP exclusive content dynamically from Supabase
  useEffect(() => {
    let mounted = true;

    const loadDynamicVipContent = async () => {
      try {
        setLoadingContent(true);

        const [videosRes, audiosRes] = await Promise.all([
          fetchVideos({ isVip: true }).catch((err) => {
            console.warn('[VipPass] fetchVideos error:', err);
            return [];
          }),
          fetchAudios({ isVip: true }).catch((err) => {
            console.warn('[VipPass] fetchAudios error:', err);
            return [];
          })
        ]);

        // Also fetch any sparks marked as is_vip from Supabase
        let sparksRes = [];
        if (supabase) {
          try {
            const { data: dbSparks, error: sparkErr } = await supabase
              .from('sparks')
              .select('id, slug, title, category, duration, thumbnail_url, is_vip, status')
              .eq('status', 'published')
              .eq('is_vip', true);

            if (!sparkErr && Array.isArray(dbSparks)) {
              sparksRes = dbSparks;
            }
          } catch (spkErr) {
            console.warn('[VipPass] Error querying VIP sparks:', spkErr);
          }
        }

        const items = [];

        // 1. Dynamic VIP Videos from Supabase
        if (Array.isArray(videosRes)) {
          videosRes.forEach((v) => {
            if (v && (v.is_vip || v.isVip)) {
              items.push({
                id: v.id,
                type: 'video',
                title: v.title || 'VIP Video Lesson',
                category: v.category || 'Mindfulness',
                duration: v.duration || '0:30',
                image: v.posterUrl || v.thumbnail_url || '/assets/images/vip-pass-card.jpg',
                icon: 'play_arrow',
                tag: `${(v.category || 'VIP VIDEO').toUpperCase()} • ${v.duration || '0:30'}`,
                raw: v
              });
            }
          });
        }

        // 2. Dynamic VIP Audios from Supabase
        if (Array.isArray(audiosRes)) {
          audiosRes.forEach((a) => {
            if (a && (a.is_vip || a.isVip)) {
              items.push({
                id: a.id,
                type: 'audio',
                title: a.title || 'VIP Audio Session',
                category: a.category || 'Resonance',
                duration: a.durationText || a.duration || '3:00',
                image: a.coverUrl || a.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg',
                icon: 'headphones',
                tag: `${(a.category || 'VIP AUDIO').toUpperCase()} • ${a.durationText || a.duration || '3:00'}`,
                raw: a
              });
            }
          });
        }

        // 3. Dynamic VIP Sparks from Supabase
        if (Array.isArray(sparksRes)) {
          sparksRes.forEach((s) => {
            if (s && s.is_vip) {
              items.push({
                id: s.slug || s.id,
                type: 'spark',
                title: s.title || 'VIP Wisdom Spark',
                category: s.category || 'Reflection',
                duration: s.duration || '4 min',
                image: s.thumbnail_url || '/assets/images/vip-pass-card.jpg',
                icon: 'auto_awesome',
                tag: `${(s.category || 'VIP SPARK').toUpperCase()} • ${s.duration || '4 MIN'}`,
                raw: s
              });
            }
          });
        }

        if (mounted) {
          setVipContent(items);
          setLoadingContent(false);
        }
      } catch (err) {
        console.warn('[VipPass] Error loading dynamic VIP content:', err);
        if (mounted) setLoadingContent(false);
      }
    };

    loadDynamicVipContent();

    return () => {
      mounted = false;
    };
  }, []);

  const handleContentClick = (item) => {
    requireAccess(item.raw || item, () => {
      if (item.type === 'video') {
        if (onNavigateToVideo) {
          onNavigateToVideo(item.id);
        } else {
          setActiveVipVideo(item.raw || item);
        }
      } else if (item.type === 'audio') {
        if (onNavigateToAudio) {
          onNavigateToAudio(item.id);
        } else {
          window.location.hash = `#/audios/${item.id}`;
        }
      } else if (item.type === 'spark') {
        if (onNavigateToSpark) {
          onNavigateToSpark(item.id);
        } else {
          window.location.hash = `#/sparks/${item.id}`;
        }
      }
    });
  };

  const closeVideoModal = () => {
    setActiveVipVideo(null);
  };

  const privileges = [
    {
      id: 'archive',
      title: 'Full Audio Archive',
      desc: 'Every past Spark and masterclass without expiration.',
      icon: 'headphones'
    },
    {
      id: 'offline',
      title: 'Offline Mode',
      desc: 'Seamless downloads for flights, commutes, and morning retreats.',
      icon: 'cloud_download'
    },
    {
      id: 'qa',
      title: 'Monthly Live Q&A',
      desc: 'Direct quarterly virtual sessions with Dr. Cubie.',
      icon: 'forum'
    },
    {
      id: 'workbooks',
      title: 'Extended Reflection Workbooks',
      desc: 'Printable guides for executive journaling and intent setting.',
      icon: 'menu_book'
    }
  ];

  return (
    <div className="vip-screen animate-fade-in">
      {/* 1. Membership Status Pill Bar */}
      <section className="vip-tier-banner" aria-label="Current Tier">
        <div className="vip-tier-left">
          <span
            className="vip-tier-dot"
            style={
              loadingMembership
                ? { backgroundColor: 'var(--color-outline-variant)' }
                : userHasVip
                ? { backgroundColor: '#22c55e' }
                : {}
            }
          />
          <span className="vip-tier-status font-label-sm">
            {loadingMembership
              ? 'CURRENT TIER: VERIFYING MEMBERSHIP...'
              : userHasVip
              ? `CURRENT TIER: VIP ${activePlan?.name ? activePlan.name.toUpperCase() : 'MEMBERSHIP'} (ACTIVE)`
              : 'CURRENT TIER: FREE GUEST'}
          </span>
        </div>
        <button
          className="vip-upgrade-link font-label-sm"
          onClick={() => {
            const planSec = document.getElementById('select-membership-section');
            planSec?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {userHasVip ? 'View Membership' : 'Explore Plans'}
        </button>
      </section>

      {/* 2. Editorial VIP Hero Card */}
      <section className="vip-hero-card" aria-label="VIP Hero">
        <div className="vip-hero-ambient" />
        <div className="vip-hero-top-row">
          <span className="vip-hero-badge font-label-sm">
            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span>VIP Mentorship Pass</span>
          </span>
          <span className="vip-cohort-tag font-label-sm">
            Annual Cohort
          </span>
        </div>

        <div className="vip-hero-heading-group">
          <h1 className="vip-hero-title font-headline-xl-mobile">
            Elevate Your Daily Practice
          </h1>
          <p className="vip-hero-subtitle font-body-md">
            Unrestricted access to Dr. Cubie's private audio archives, exclusive video masterclasses, and offline library.
          </p>
        </div>

        {/* Gallery Image with Accent Badge */}
        <div className="vip-hero-media">
          <ImageWithFallback
            src="/assets/images/vip-pass-card.jpg"
            fallbackSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuC0iXAYxTgJuwmfRSDFtz60HNFaddZz7VPbasYhfaA__ylEcq7YSisOxTzwwRcTEpmAFE7oC0Y9iGaavseRnOqfrbqAjxYC7rUih2NRPTdFPOit9bcbDKHDEze2lejgky_M7zzXz8yxzKvZveJszaJ3X3nHVTLconN-rlgJIAwEX2oN2YbQixbm98RIDcLZ-Fy104o7LoLNv8WaBk64mrxP9ZXa9zUIFAbEc-e2BBGksD_ygIHKajMRwg"
            type="spark"
            alt="VIP Private Gallery"
            className="vip-hero-img"
          />
          <div className="vip-hero-gradient-overlay" />
          <div className="vip-hero-counter-badge font-label-sm" />
        </div>
      </section>

      {/* 3. Included Privileges */}
      <section className="vip-privileges-section" aria-label="Included Privileges">
        <div className="vip-privileges-header">
          <span className="vip-privileges-label font-label-sm">
            Included Privileges
          </span>
          <span className="vip-all-inclusive font-label-sm">
            All-Inclusive
          </span>
        </div>

        <div className="vip-privileges-grid">
          {privileges.map((p) => (
            <article key={p.id} className="vip-privilege-card">
              <div className="vip-privilege-icon-wrap">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {p.icon}
                </span>
              </div>
              <h3 className="vip-privilege-title font-title-sm">
                {p.title}
              </h3>
              <p className="vip-privilege-desc font-body-sm">
                {p.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 4. VIP Content Section (Dynamic from Supabase) */}
      <section className="vip-exclusive-sparks-section" aria-label="VIP Content">
        <div className="vip-exclusive-header">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            lock_open
          </span>
          <h3 className="vip-exclusive-title font-title-md">
            VIP Content
          </h3>
        </div>

        <div className="vip-exclusive-list">
          {loadingContent ? (
            <div className="vip-empty-content-box font-body-sm text-secondary">
              Loading VIP sanctuary content...
            </div>
          ) : vipContent.length === 0 ? (
            <div className="vip-empty-content-box">
              <span className="material-symbols-outlined vip-empty-icon">workspace_premium</span>
              <p className="font-body-sm text-secondary" style={{ margin: 0 }}>
                No VIP exclusive content available at this time.
              </p>
            </div>
          ) : (
            vipContent.map((item) => (
              <article
                key={`${item.type}-${item.id}`}
                className="vip-exclusive-row btn-pressable"
                onClick={() => handleContentClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleContentClick(item)}
              >
                <div className="vip-exclusive-left">
                  <div className="vip-exclusive-thumb-wrap">
                    <ImageWithFallback
                      src={item.image}
                      fallbackSrc="/assets/images/vip-pass-card.jpg"
                      type={item.type === 'video' ? 'video' : 'spark'}
                      alt={item.title}
                      className="vip-exclusive-thumb-img"
                    />
                    <div className="vip-exclusive-play-overlay">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                        {item.icon}
                      </span>
                    </div>
                  </div>
                  <div className="vip-exclusive-meta">
                    <span className="vip-exclusive-tag font-label-sm">
                      {item.tag}
                    </span>
                    <h4 className="vip-exclusive-item-title font-body-md">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <span className="material-symbols-outlined vip-chevron" style={{ fontSize: '20px' }}>
                  chevron_right
                </span>
              </article>
            ))
          )}
        </div>
      </section>

      {/* 5. Select Your Membership Section (Dynamic from Supabase) */}
      <section className="vip-pricing-section" id="select-membership-section" aria-label="Membership Options">
        <h2 className="vip-pricing-heading font-title-lg">
          {loadingMembership
            ? 'Membership Status'
            : userHasVip
            ? 'Your VIP Membership'
            : 'Available Memberships'}
        </h2>

        {loadingMembership ? (
          /* STATE E: LOADING STATE — Skeleton shimmer while verifying Supabase status */
          <div className="vip-membership-skeleton-container" aria-busy="true" aria-label="Verifying membership status">
            <div className="vip-pricing-card vip-pricing-card-static vip-pricing-skeleton-card" style={{ padding: '1.25rem 1.15rem', width: '100%', boxSizing: 'border-box' }}>
              <div className="vip-pricing-details" style={{ width: '100%' }}>
                <div className="vip-pricing-title-row" style={{ marginBottom: '0.8rem' }}>
                  <div
                    className="vip-skeleton-shimmer"
                    style={{ width: '45%', height: '20px', borderRadius: '6px' }}
                  />
                  <div
                    className="vip-skeleton-shimmer"
                    style={{ width: '22%', height: '18px', borderRadius: '999px' }}
                  />
                </div>
                <div
                  className="vip-skeleton-shimmer"
                  style={{ width: '85%', height: '14px', borderRadius: '4px', marginBottom: '0.6rem' }}
                />
                <div
                  className="vip-skeleton-shimmer"
                  style={{ width: '60%', height: '14px', borderRadius: '4px', marginBottom: '1.25rem' }}
                />
                <div
                  className="vip-skeleton-shimmer"
                  style={{ width: '100%', height: '44px', borderRadius: '12px' }}
                />
              </div>
            </div>
          </div>
        ) : userHasVip ? (
          /* STATE B: ACTIVE VIP STATE — NO PURCHASE CARDS SHOWN */
          <div className="vip-active-membership-container animate-fade-in">
            <div className="vip-active-membership-card">
              <div className="vip-active-membership-top">
                <div className="vip-active-badge-pill font-label-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  <span>VIP Membership Active</span>
                </div>
                <span className="vip-active-status-chip font-label-sm">
                  Active
                </span>
              </div>

              <div className="vip-active-plan-header">
                <h3 className="vip-active-plan-title font-title-lg">
                  {activePlan?.name || 'VIP Sanctuary Membership'}
                </h3>
                <p className="vip-active-plan-desc font-body-sm">
                  Your account has full unrestricted access to Dr. Cubie's private audio sanctuary, exclusive video masterclasses, and offline library.
                </p>
              </div>

              <div className="vip-active-details-grid font-body-sm">
                <div className="vip-active-detail-item">
                  <span className="vip-active-detail-label text-secondary font-label-sm">Billing Period</span>
                  <span className="vip-active-detail-val">
                    {activePlan?.billing_period || 'Annual'}
                  </span>
                </div>
                <div className="vip-active-detail-item">
                  <span className="vip-active-detail-label text-secondary font-label-sm">Active Since</span>
                  <span className="vip-active-detail-val">
                    {formatMembershipDate(membershipInfo?.startDate || profile?.created_at)}
                  </span>
                </div>
                {membershipInfo?.endDate && (
                  <div className="vip-active-detail-item">
                    <span className="vip-active-detail-label text-secondary font-label-sm">Renews / Valid Until</span>
                    <span className="vip-active-detail-val">
                      {formatMembershipDate(membershipInfo.endDate)}
                    </span>
                  </div>
                )}
                <div className="vip-active-detail-item">
                  <span className="vip-active-detail-label text-secondary font-label-sm">Status</span>
                  <span className="vip-active-detail-val" style={{ color: '#16a34a', fontWeight: 600 }}>
                    Active &amp; Paid
                  </span>
                </div>
              </div>

              <div className="vip-active-privileges-box">
                <span className="vip-active-privileges-title font-label-md">
                  Active Included Privileges:
                </span>
                <ul className="vip-active-privileges-list">
                  <li className="font-body-sm">
                    <span className="material-symbols-outlined vip-active-check">check_circle</span>
                    <span>Full Audio Sanctuary &amp; VIP Masterclasses unlocked</span>
                  </li>
                  <li className="font-body-sm">
                    <span className="material-symbols-outlined vip-active-check">check_circle</span>
                    <span>Offline download capability enabled across your devices</span>
                  </li>
                  <li className="font-body-sm">
                    <span className="material-symbols-outlined vip-active-check">check_circle</span>
                    <span>Exclusive reflection workbooks and guided contemplative practice</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="vip-cta-wrap">
              <div className="vip-active-status-bar" role="status">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#16a34a' }}>
                  task_alt
                </span>
                <span className="font-body-md" style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  VIP Privileges Enabled
                </span>
              </div>
              <p className="vip-cta-disclaimer font-body-sm">
                Your VIP membership is active and verified in your Dr. Cubie account. No additional purchase needed.
              </p>
            </div>
          </div>
        ) : (
          /* STATE A, C, D: NOT VIP / REVOKED / EXPIRED — Available dynamic membership plans from Supabase */
          <>
            {membershipInfo?.status === 'revoked' && (
              <div className="vip-membership-status-banner vip-membership-status-revoked animate-fade-in" role="status">
                <div className="vip-status-banner-content">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
                    info
                  </span>
                  <div>
                    <p className="vip-status-banner-title font-label-md">No Active Membership</p>
                    <p className="vip-status-banner-text font-body-sm text-secondary">
                      Your VIP access has been updated by the administrator. Select an active plan below to resume full sanctuary privileges.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {membershipInfo?.status === 'expired' && (
              <div className="vip-membership-status-banner vip-membership-status-expired animate-fade-in" role="status">
                <div className="vip-status-banner-content">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-outline)' }}>
                    history
                  </span>
                  <div>
                    <p className="vip-status-banner-title font-label-md">Membership Expired</p>
                    <p className="vip-status-banner-text font-body-sm text-secondary">
                      Your previous VIP membership term has concluded. Select an active plan below to renew your sanctuary privileges.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {loadingPlans ? (
              <div className="vip-pricing-cards-group" aria-busy="true" aria-label="Loading membership plans">
                {[1, 2].map((n) => (
                  <div key={n} className="vip-pricing-card vip-pricing-card-static vip-pricing-skeleton-card">
                    <div className="vip-pricing-details" style={{ width: '100%' }}>
                      <div className="vip-pricing-title-row" style={{ marginBottom: '0.4rem' }}>
                        <div
                          className="vip-skeleton-shimmer"
                          style={{ width: '48%', height: '18px', borderRadius: '4px' }}
                        />
                        <div
                          className="vip-skeleton-shimmer"
                          style={{ width: '22%', height: '16px', borderRadius: '999px' }}
                        />
                      </div>
                      <div
                        className="vip-skeleton-shimmer"
                        style={{ width: '70%', height: '14px', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : plansError ? (
              <div className="vip-empty-content-box" role="alert">
                <span className="material-symbols-outlined vip-empty-icon" style={{ color: 'var(--color-outline)' }}>
                  cloud_off
                </span>
                <p className="font-body-md" style={{ margin: 0, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  Unable to Load Membership Plans
                </p>
                <p className="font-body-sm text-secondary" style={{ margin: 0 }}>
                  {plansError}
                </p>
                <button
                  type="button"
                  className="vip-pricing-retry-btn font-label-sm"
                  onClick={loadDynamicMembershipPlans}
                >
                  Retry
                </button>
              </div>
            ) : membershipPlans.length === 0 ? (
              <div className="vip-empty-content-box" role="status">
                <span className="material-symbols-outlined vip-empty-icon">
                  loyalty
                </span>
                <p className="font-body-md" style={{ margin: 0, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  No Active Membership Plans Available
                </p>
                <p className="font-body-sm text-secondary" style={{ margin: 0 }}>
                  Please check back later or contact the administrator regarding membership options.
                </p>
              </div>
            ) : (
              <div className="vip-pricing-cards-group" role="radiogroup" aria-label="Membership options">
                {membershipPlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const priceText = formatMembershipPlanPrice(plan);
                  const hasFeatures = Array.isArray(plan.features) && plan.features.length > 0;

                  return (
                    <div
                      key={plan.id}
                      className={`vip-pricing-card btn-pressable ${isSelected ? 'selected' : ''}${hasFeatures ? ' has-features' : ''}`}
                      onClick={() => setSelectedPlanId(plan.id)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPlanId(plan.id);
                        }
                      }}
                      aria-label={`${plan.name}, ${priceText}${isSelected ? ', selected' : ''}`}
                    >
                      <div className="vip-radio-icon">
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: '22px',
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                            fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0"
                          }}
                        >
                          {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <div className="vip-pricing-details">
                        <div className="vip-pricing-title-row">
                          <span className="vip-pricing-name font-title-md">
                            {plan.name}
                          </span>
                          {plan.discount_text && (
                            <span className="vip-save-badge font-label-sm">
                              {plan.discount_text}
                            </span>
                          )}
                        </div>
                        {priceText && (
                          <p className="vip-pricing-price font-body-md">
                            {priceText}
                          </p>
                        )}
                        {plan.description && plan.description.trim().length > 35 && (
                          <p className="vip-pricing-desc font-body-sm">
                            {plan.description.trim()}
                          </p>
                        )}
                        {hasFeatures && (
                          <ul className="vip-pricing-features-list" aria-label="Plan benefits">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="vip-pricing-feature-item font-body-sm">
                                <span className="material-symbols-outlined vip-pricing-feature-check">
                                  check
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA / Membership Status Area */}
            <div className="vip-cta-wrap">
              <button
                type="button"
                className="vip-start-trial-btn btn-pressable"
                disabled={!selectedPlan}
                onClick={() => {
                  if (!isAuthenticated) {
                    if (openAuth) {
                      openAuth('signin');
                    }
                    return;
                  }
                  if (userHasVip) {
                    return;
                  }
                  if (selectedPlan) {
                    setIsCheckoutOpen(true);
                  }
                }}
                aria-label={
                  selectedPlan
                    ? `Continue to Payment for ${selectedPlan.name}`
                    : 'Select a membership plan to continue'
                }
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>
                  {selectedPlan ? 'lock' : 'touch_app'}
                </span>
                <span>
                  {selectedPlan
                    ? Number(selectedPlan.trial_days) > 0
                      ? `Continue to Payment • Start ${selectedPlan.trial_days}-Day Trial`
                      : `Continue to Payment • ${formatPriceValue(selectedPlan.price)}`
                    : 'Select a Membership Plan'}
                </span>
              </button>
              <p className="vip-cta-disclaimer font-body-sm">
                {selectedPlan
                  ? Number(selectedPlan.trial_days) > 0
                    ? `${selectedPlan.trial_days} days complimentary trial. Cancel anytime in your profile settings.`
                    : 'No commitment. Cancel anytime in your profile settings.'
                  : 'Choose a membership plan above to proceed.'}
              </p>

              <div className="vip-contact-admin-card" role="status" style={{ marginTop: '0.5rem' }}>
                <div className="vip-contact-admin-icon-wrap">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    admin_panel_settings
                  </span>
                </div>
                <div className="vip-contact-admin-body">
                  <h3 className="vip-contact-admin-title font-title-sm">
                    VIP Membership Inquiries
                  </h3>
                  <p className="vip-contact-admin-desc font-body-sm">
                    Please contact the administrator regarding VIP membership.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Payment / Checkout Bottom Sheet Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen && !userHasVip}
        plan={selectedPlan}
        onClose={() => {
          setIsCheckoutOpen(false);
          loadUserMembership();
        }}
        onSuccess={(receipt) => {
          setCheckoutReceipt(receipt);
          loadUserMembership();
        }}
      />

      {/* 6. VIP Video Playback Modal (Fallback if inline modal is triggered) */}
      {activeVipVideo && (
        <div className="vip-video-modal-backdrop animate-fade-in" onClick={closeVideoModal}>
          <div
            className="vip-video-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${activeVipVideo.title} VIP Video Session`}
          >
            <div className="vip-video-modal-header">
              <div className="vip-video-modal-badge font-label-sm">
                VIP SESSION • {activeVipVideo.categoryBadge || activeVipVideo.category}
              </div>
              <button
                className="vip-video-modal-close-btn btn-pressable"
                onClick={closeVideoModal}
                aria-label="Close VIP video player"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="vip-video-modal-player-viewport">
              <VideoPlayer
                src={activeVipVideo.videoUrl}
                poster={activeVipVideo.posterUrl}
                title={activeVipVideo.title}
                durationLabel={activeVipVideo.duration}
                variant="hero"
              />
            </div>

            <div className="vip-video-modal-body">
              <h3 className="vip-video-modal-title font-headline-md">
                {activeVipVideo.title}
              </h3>
              <p className="vip-video-modal-subtitle font-body-md">
                {activeVipVideo.subtitle}
              </p>
              <div className="vip-video-modal-meta font-label-sm">
                <span>Duration: {activeVipVideo.duration}</span>
                <span>•</span>
                <span>Instructor: Dr. Cubie</span>
                <span>•</span>
                <span>VIP Masterclass</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
