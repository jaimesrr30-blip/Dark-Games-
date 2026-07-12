import * as THREE from "three";
import type { CarBody } from "../entities/Car";
import type { Ball } from "./Ball";

export interface AiConfig {
  aggressiveness: number; // 0..1
  targetGoalZ: number; // hacia dónde ataca esta IA
  ownGoalZ: number;
  skill: number; // 0..1, afecta precisión y uso de turbo/salto
}

export function aiInput(car: CarBody, ball: Ball, cfg: AiConfig, dt: number) {
  const toBall = new THREE.Vector2(ball.position.x - car.position.x, ball.position.z - car.position.z);
  const distToBall = toBall.length();

  // posición defensiva/ofensiva: si el balón está muy cerca de la portería propia, prioriza defender
  const defending = Math.sign(cfg.ownGoalZ) === Math.sign(ball.position.z - cfg.ownGoalZ) && Math.abs(ball.position.z - cfg.ownGoalZ) < 22;

  let targetX = ball.position.x;
  let targetZ = ball.position.z;
  if (!defending) {
    // aproximarse por detrás del balón respecto a la portería rival para empujarlo hacia adelante
    const towardGoal = new THREE.Vector2(0, Math.sign(cfg.targetGoalZ - ball.position.z));
    targetX = ball.position.x - towardGoal.x * 4;
    targetZ = ball.position.z - towardGoal.y * 4;
  } else {
    targetX = THREE.MathUtils.lerp(ball.position.x, 0, 0.3);
    targetZ = THREE.MathUtils.lerp(ball.position.z, cfg.ownGoalZ * 0.7, 0.4);
  }

  const toTarget = new THREE.Vector2(targetX - car.position.x, targetZ - car.position.z);
  const desiredHeading = Math.atan2(toTarget.x, toTarget.y);
  let diff = desiredHeading - car.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const steer = THREE.MathUtils.clamp(-diff * 1.6, -1, 1);
  const throttle = toTarget.length() > 1.5 ? 1 : THREE.MathUtils.clamp(toTarget.length() / 1.5, 0.15, 1);
  const boost = distToBall < 30 && Math.abs(diff) < 0.6 && cfg.skill > Math.random() * 0.6;
  const jumpPressed = distToBall < 3.5 && ball.position.y > car.position.y + 1.2 && cfg.skill > Math.random() * 0.5;

  void dt;
  return { throttle, steer, boost, jumpPressed };
}
