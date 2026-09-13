import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  Target,
} from 'lucide-react';

import PageWrapper from '../components/layout/PageWrapper';
import * as resumeApi from '../api/resume';


export const RoadmapPage = () => {
  const location = useLocation();

  const role =
    location.state?.role ||
    null;

  const resume =
    location.state?.resumeData ||
    location.state?.resume ||
    null;

  const missingSkills =
    location.state?.missingSkills ||
    [];

  const partialSkills =
    location.state?.partialSkills ||
    [];

  const [roadmap, setRoadmap] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');

const [courseSuggestions, setCourseSuggestions] = useState({});
const [coursesLoading, setCoursesLoading] = useState(false);
const [coursesError, setCoursesError] = useState('');

const requestStartedRef = useRef(false);
const courseRequestStartedRef = useRef(false);


  // ---------------------------------------------------------
  // ROLE NAME
  // ---------------------------------------------------------

  const roleTitle =
    typeof role === 'string'
      ? role
      : role?.title ||
        role?.role ||
        role?.name ||
        'Selected Career Role';


  // ---------------------------------------------------------
  // LOAD ROADMAP
  // ---------------------------------------------------------

  useEffect(() => {

    if (!role || !resume) {
      console.warn(
        '[Roadmap] Missing role or resume.',
        {
          role,
          resume,
        }
      );

      return;
    }

    if (requestStartedRef.current) {
      console.log(
        '[Roadmap] Duplicate request prevented.'
      );

      return;
    }

    requestStartedRef.current = true;

    const fetchRoadmap = async () => {

      setIsLoading(true);
      setError('');
      setRoadmap(null);

      try {

        console.log(
          '[Roadmap] Sending current resume and role:',
          {
            role,
            resume,
            missingSkills,
            partialSkills,
          }
        );

        const response =
          await resumeApi.generateRoadmap({
            role,
            resume,
            missingSkills,
            partialSkills,
          });

        console.log(
          '[Roadmap] Backend response:',
          response
        );

        if (!response) {
          throw new Error(
            'Empty roadmap response from backend.'
          );
        }

        if (
          !Array.isArray(response.phases)
        ) {
          throw new Error(
            'Backend returned no roadmap phases.'
          );
        }

        setRoadmap(response);

      } catch (err) {

        console.error(
          '[Roadmap] Generation failed:',
          err
        );

        setError(
          err?.response?.data?.detail ||
          err?.message ||
          'Unable to generate the personalized roadmap.'
        );

      } finally {

        setIsLoading(false);

      }
    };

    fetchRoadmap();

  }, []);
useEffect(() => {
  if (!role) {
    return;
  }

  if (courseRequestStartedRef.current) {
    console.log('[Roadmap] Duplicate course request prevented.');
    return;
  }

  courseRequestStartedRef.current = true;

  const fetchCourseSuggestions = async () => {
    setCoursesLoading(true);
    setCoursesError('');

    try {
      console.log(
        '[Roadmap] Loading Direct Learning Suggestions:',
        {
          role,
          missingSkills,
          partialSkills,
        }
      );

      const response = await resumeApi.getCourseSuggestions({
        role,
        missingSkills,
        partialSkills,
      });

      console.log(
        '[Roadmap] Course suggestions response:',
        response
      );

      setCourseSuggestions(
        response?.course_suggestions || {}
      );

    } catch (err) {
      console.error(
        '[Roadmap] Course suggestions failed:',
        err
      );

      setCoursesError(
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to load direct learning suggestions.'
      );

    } finally {
      setCoursesLoading(false);
    }
  };

  fetchCourseSuggestions();

}, []);


  // ---------------------------------------------------------
  // MISSING PARAMETERS
  // ---------------------------------------------------------

  if (!role || !resume) {

    return (
      <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

        <div className="glass-card rounded-3xl p-8 text-center border border-navy-700/80">

          <Target className="w-12 h-12 mx-auto text-brand-blue-light mb-4" />

          <h1 className="text-2xl font-heading font-bold text-white">
            Roadmap Parameters Missing
          </h1>

          <p className="text-sm text-slate-400 mt-3 mb-6">
            Please return to Skill Gap and build the roadmap
            from a selected career role.
          </p>

          <Link
            to="/skill-gap"
            state={{
              role,
              resumeData: resume,
              missingSkills,
              partialSkills,
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-blue text-white font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Skill Gap
          </Link>

        </div>

      </PageWrapper>
    );
  }


  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (isLoading) {

    return (
      <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

        <div className="glass-card rounded-3xl p-14 text-center border border-brand-blue/30">

          <Loader2 className="w-10 h-10 mx-auto text-brand-blue-light animate-spin mb-5" />

          <h1 className="text-2xl font-heading font-bold text-white">
            Building Your Personalized Roadmap
          </h1>

          <p className="text-sm text-slate-400 mt-3">
            AI is creating a learning plan specifically for{' '}
            <span className="text-brand-blue-light">
              {roleTitle}
            </span>
            .
          </p>

        </div>

      </PageWrapper>
    );
  }


  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error) {

    return (
      <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

        <div className="glass-card rounded-3xl p-8 border border-red-500/30">

          <Target className="w-10 h-10 text-red-400 mb-4" />

          <h1 className="text-2xl font-heading font-bold text-white">
            Roadmap Generation Failed
          </h1>

          <p className="text-sm text-red-300 mt-3">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-3 rounded-xl bg-brand-blue text-white font-semibold"
          >
            Try Again
          </button>

        </div>

      </PageWrapper>
    );
  }


  const phases =
    Array.isArray(roadmap?.phases)
      ? roadmap.phases
      : [];


  const targetSkills =
    Array.isArray(roadmap?.target_skills)
      ? roadmap.target_skills
      : [];


  // ---------------------------------------------------------
  // NORMALIZE SKILLS
  // ---------------------------------------------------------

  const normalizeSkillName = (skill) => {

    if (typeof skill === 'string') {
      return skill;
    }

    if (skill && typeof skill === 'object') {
      return (
        skill.name ||
        skill.skill ||
        skill.title ||
        ''
      );
    }

    return '';
  };


  // ---------------------------------------------------------
  // COURSE CARD
  // ---------------------------------------------------------

  const CourseCard = ({ course }) => {

    if (!course) {
      return null;
    }

    if (typeof course === 'string') {

      return (
        <div className="p-4 rounded-2xl bg-navy-900/80 border border-navy-700">

          <div className="flex items-start gap-3">

            <BookOpen className="w-5 h-5 text-brand-gold flex-shrink-0" />

            <div>
              <h4 className="text-sm font-semibold text-white">
                {course}
              </h4>
            </div>

          </div>

        </div>
      );
    }

    const title =
      course.title ||
      course.name ||
      'Recommended Learning Resource';

    const provider =
      course.provider ||
      'Recommended Provider';

    const skill =
      course.skill ||
      '';

    const reason =
      course.reason ||
      '';

    const url =
      course.url ||
      course.link ||
      '';

    return (
      <div className="p-4 rounded-2xl bg-navy-900/80 border border-navy-700">

        <div className="flex items-start gap-3">

          <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center flex-shrink-0">

            <BookOpen className="w-4 h-4 text-brand-blue-light" />

          </div>

          <div className="flex-1">

            <h4 className="text-sm font-semibold text-white">
              {title}
            </h4>

            <p className="text-xs text-brand-blue-light mt-1">
              {provider}
            </p>

            {skill && (
              <p className="text-[11px] text-slate-500 mt-2">
                Skill:{' '}
                <span className="text-slate-300">
                  {skill}
                </span>
              </p>
            )}

            {reason && (
              <p className="text-xs text-slate-400 mt-2">
                {reason}
              </p>
            )}

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-brand-blue-light hover:text-white"
              >
                Open Course
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

          </div>

        </div>

      </div>
    );
  };


  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <PageWrapper className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

      {/* HEADER */}

      <div className="mb-8">

        <Link
          to="/skill-gap"
          state={{
            role,
            resumeData: resume,
            missingSkills,
            partialSkills,
          }}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Skill Gap
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-brand-blue-light text-xs font-mono mb-3">

          <Target className="w-3.5 h-3.5" />

          Personalized Career Roadmap

        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">

          Learning Roadmap:{' '}

          <span className="text-brand-blue-light">
            {roadmap?.role || roleTitle}
          </span>

        </h1>

        <p className="text-sm text-slate-400 mt-2">
          Generated from your current resume, selected role,
          and identified skill gaps.
        </p>

      </div>


      {/* SUMMARY */}

      <div className="glass-card rounded-3xl p-6 border border-navy-700/80 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Target className="w-4 h-4 text-brand-blue-light" />
              Target Role
            </div>

            <p className="text-lg font-heading font-bold text-white">
              {roadmap?.role || roleTitle}
            </p>

          </div>


          <div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Clock3 className="w-4 h-4 text-cyan-400" />
              Timeline
            </div>

            <p className="text-lg font-heading font-bold text-white">
              {roadmap?.target_timeline ||
                roadmap?.targetTimeline ||
                '12 weeks'}
            </p>

          </div>


          <div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Layers className="w-4 h-4 text-brand-gold" />
              Phases
            </div>

            <p className="text-lg font-heading font-bold text-white">
              {phases.length}
            </p>

          </div>

        </div>

      </div>


      {/* TARGET SKILLS */}

      {targetSkills.length > 0 && (

        <div className="glass-card rounded-3xl p-6 border border-navy-700/80 mb-6">

          <div className="flex items-center gap-2 mb-4">

            <GraduationCap className="w-5 h-5 text-brand-blue-light" />

            <h2 className="font-heading font-bold text-white">
              Target Skills
            </h2>

          </div>

          <div className="flex flex-wrap gap-2">

            {targetSkills.map((skill, index) => {

              const name =
                normalizeSkillName(skill);

              return (
                <span
                  key={`${name}-${index}`}
                  className="px-3 py-1.5 rounded-lg bg-navy-850 border border-navy-700 text-xs text-slate-200"
                >
                  {name}
                </span>
              );

            })}

          </div>

        </div>

      )}


      {/* PHASES */}

      <div className="space-y-6">

        {phases.map((phase, phaseIndex) => {

          const phaseNumber =
            phase?.phase ||
            phase?.step ||
            phaseIndex + 1;

          const phaseTitle =
            phase?.title ||
            phase?.name ||
            `Phase ${phaseNumber}`;

          const description =
            phase?.description ||
            'Develop role-specific skills for the selected career.';

          const duration =
            phase?.duration ||
            '4 weeks';

          const skills =
            Array.isArray(phase?.skills)
              ? phase.skills
              : [];

          const courses =
            Array.isArray(phase?.courses)
              ? phase.courses
              : [];

          const project =
            phase?.project ||
            phase?.activity ||
            '';

          return (

            <motion.div
              key={phaseIndex}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: phaseIndex * 0.08,
              }}
              className="glass-card rounded-3xl p-6 border border-navy-700/80"
            >

              {/* PHASE HEADER */}

              <div className="flex items-start gap-4 mb-5">

                <div className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center flex-shrink-0">

                  <span className="font-bold text-brand-blue-light">
                    {phaseNumber}
                  </span>

                </div>

                <div className="flex-1">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                    <h2 className="text-xl font-heading font-bold text-white">
                      {phaseTitle}
                    </h2>

                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock3 className="w-3.5 h-3.5" />
                      {duration}
                    </span>

                  </div>

                  <p className="text-sm text-slate-400 mt-2">
                    {description}
                  </p>

                </div>

              </div>


              {/* SKILLS */}

              {skills.length > 0 && (

                <div className="mb-5">

                  <div className="flex items-center gap-2 mb-3">

                    <Layers className="w-4 h-4 text-brand-blue-light" />

                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      Skills to Learn
                    </h3>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    {skills.map((skill, skillIndex) => {

                      const name =
                        normalizeSkillName(skill);

                      if (!name) {
                        return null;
                      }

                      return (
                        <span
                          key={`${name}-${skillIndex}`}
                          className="px-3 py-1.5 rounded-lg bg-navy-850 border border-navy-700 text-xs text-slate-200"
                        >
                          {name}
                        </span>
                      );

                    })}

                  </div>

                </div>

              )}


              {/* PROJECT */}

              {project && (

                <div className="mb-5 p-4 rounded-2xl bg-navy-950/70 border border-navy-800">

                  <div className="flex items-start gap-3">

                    <Lightbulb className="w-5 h-5 text-brand-gold flex-shrink-0" />

                    <div>

                      <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                        Practical Project
                      </h3>

                      <p className="text-sm text-slate-400 leading-relaxed">
                        {project}
                      </p>

                    </div>

                  </div>

                </div>

              )}


              {/* COURSES */}

              {courses.length > 0 && (

                <div>

                  <div className="flex items-center gap-2 mb-3">

                    <BookOpen className="w-4 h-4 text-cyan-400" />

                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      Recommended Courses
                    </h3>

                  </div>

                  <div className="space-y-3">

                    {courses.map(
                      (course, courseIndex) => (
                        <CourseCard
                          key={courseIndex}
                          course={course}
                        />
                      )
                    )}

                  </div>

                </div>

              )}

            </motion.div>

          );

        })}

      </div>
            {/* DIRECT LEARNING SUGGESTIONS */}

      <div className="glass-card rounded-3xl p-6 border border-brand-blue/30 mt-6">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center">

            <BookOpen className="w-5 h-5 text-brand-blue-light" />

          </div>

          <div>
            <h2 className="text-lg font-heading font-bold text-white">
              Direct Learning Suggestions
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Learning resources selected for your identified skill gaps.
            </p>
          </div>

        </div>


        {coursesLoading && (

          <div className="flex items-center gap-3 py-6 text-sm text-slate-400">

            <Loader2 className="w-5 h-5 animate-spin text-brand-blue-light" />

            Finding learning resources for your missing skills...

          </div>

        )}


        {!coursesLoading && coursesError && (

          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20">

            <p className="text-sm text-red-300">
              {coursesError}
            </p>

          </div>

        )}


        {!coursesLoading &&
         !coursesError &&
         Object.keys(courseSuggestions).length === 0 && (

          <div className="p-5 rounded-2xl bg-navy-950/70 border border-navy-800">

            <p className="text-sm text-slate-400">
              No additional learning suggestions are required for the
              current skill gap.
            </p>

          </div>

        )}


        {!coursesLoading &&
         !coursesError &&
         Object.entries(courseSuggestions).map(
           ([skillName, courses]) => (

            <div
              key={skillName}
              className="mb-6 last:mb-0"
            >

              <div className="flex items-center gap-2 mb-3">

                <GraduationCap className="w-4 h-4 text-cyan-400" />

                <h3 className="text-sm font-heading font-semibold text-white">
                  {skillName}
                </h3>

              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {Array.isArray(courses) &&
                  courses.map((course, index) => (

                    <CourseCard
                      key={`${skillName}-${index}`}
                      course={course}
                    />

                  ))}

              </div>

            </div>

         ))
        }

      </div>


      {/* FINAL PROJECT */}

      {roadmap?.final_project && (

        <div className="glass-card rounded-3xl p-6 border border-brand-blue/30 bg-brand-blue/5 mt-6">

          <div className="flex items-start gap-4">

            <CheckCircle2 className="w-6 h-6 text-brand-blue-light flex-shrink-0" />

            <div>

              <h2 className="text-lg font-heading font-bold text-white">
                Final Project
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                {roadmap.final_project}
              </p>

            </div>

          </div>

        </div>

      )}


      {/* CAREER ADVICE */}

      {roadmap?.career_advice && (

        <div className="glass-card rounded-3xl p-6 border border-navy-700/80 mt-6">

          <div className="flex items-start gap-3">

            <Lightbulb className="w-5 h-5 text-brand-gold flex-shrink-0" />

            <div>

              <h2 className="text-lg font-heading font-bold text-white">
                Career Advice
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                {roadmap.career_advice}
              </p>

            </div>

          </div>

        </div>

      )}


      {/* FOOTER */}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-navy-800">

        <Link
          to="/skill-gap"
          state={{
            role,
            resumeData: resume,
            missingSkills,
            partialSkills,
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-navy-850 border border-navy-700 text-slate-300 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Review Skill Gap
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-sm"
        >
          Finish
          <ArrowRight className="w-4 h-4" />
        </Link>

      </div>

    </PageWrapper>
  );
};


export default RoadmapPage;